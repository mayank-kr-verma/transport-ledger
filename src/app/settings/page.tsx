"use client";
import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, readSettings } from "@/db/schema";
import { hashPin, verifyPin } from "@/lib/pin";
import { exportDbJSON, downloadBlob, importDbJSON } from "@/lib/export";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui/primitives";

export default function SettingsPage() {
  const settings = useLiveQuery(() => readSettings(), []);
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setName(settings.businessName);
      setGstin(settings.businessGstin ?? "");
    }
  }, [settings]);

  const saveBiz = async () => {
    await db.settings.update(1, { businessName: name.trim() || "My Transport", businessGstin: gstin.trim() || undefined });
    setMsg("Business info saved.");
  };

  const changePin = async () => {
    if (!settings?.pinHash) return;
    const ok = await verifyPin(oldPin, settings.pinHash, settings.salt!);
    if (!ok) { setMsg("Old PIN incorrect."); return; }
    if (!/^\d{4}$/.test(newPin)) { setMsg("New PIN must be 4 digits."); return; }
    const { hash, salt } = await hashPin(newPin);
    await db.settings.update(1, { pinHash: hash, salt });
    setOldPin(""); setNewPin(""); setMsg("PIN updated.");
  };

  const onExport = async () => {
    const blob = await exportDbJSON();
    downloadBlob(blob, `transport-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`);
    await db.settings.update(1, { lastBackupAt: new Date().toISOString() });
    setMsg("Backup downloaded.");
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Import will REPLACE all current data. Continue?")) { e.target.value = ""; return; }
    try {
      await importDbJSON(file);
      setMsg("Backup restored. Reload the app.");
    } catch (err) {
      setMsg(`Import failed: ${(err as Error).message}`);
    } finally {
      e.target.value = "";
    }
  };

  const onWipe = async () => {
    if (!confirm("Erase ALL local data including PIN? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;
    await db.delete();
    sessionStorage.removeItem("tl_unlocked");
    location.reload();
  };

  return (
    <div className="space-y-3">
      <PageHeader title="Settings" />
      {msg && <Card className="border-blue-200 bg-blue-50 text-sm text-blue-900">{msg}</Card>}

      <Card>
        <h2 className="mb-2 font-semibold">Business Info</h2>
        <Field label="Business Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="GSTIN"><Input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} /></Field>
        <Button onClick={saveBiz}>Save</Button>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Change PIN</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Old PIN">
            <Input type="password" inputMode="numeric" maxLength={4} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="New PIN">
            <Input type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} />
          </Field>
        </div>
        <Button onClick={changePin}>Update PIN</Button>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Backup & Restore</h2>
        <p className="mb-3 text-sm text-slate-600">
          All data lives in this browser. Back up regularly. Last backup: {settings?.lastBackupAt?.slice(0, 10) ?? "never"}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExport}>Export JSON</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import JSON</Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onImport} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold text-red-700">Danger Zone</h2>
        <p className="mb-3 text-sm text-slate-600">Erase all data on this device.</p>
        <Button variant="danger" onClick={onWipe}>Erase All Data</Button>
      </Card>
    </div>
  );
}
