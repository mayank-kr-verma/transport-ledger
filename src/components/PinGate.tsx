"use client";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, readSettings, ensureSettings } from "@/db/schema";
import { hashPin, verifyPin } from "@/lib/pin";
import { Button, Input, Card } from "@/components/ui/primitives";

const SESSION_KEY = "tl_unlocked";

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const settings = useLiveQuery(() => readSettings(), []);

  useEffect(() => {
    ensureSettings();
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
  }, []);

  if (settings === undefined) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (unlocked) return <>{children}</>;

  const hasPin = !!settings.pinHash;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!hasPin) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        setError("PIN must be 4 digits.");
        return;
      }
      if (pin !== pin2) {
        setError("PINs do not match.");
        return;
      }
      const { hash, salt } = await hashPin(pin);
      await db.settings.put({ ...settings, pinHash: hash, salt });
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      const ok = await verifyPin(pin, settings.pinHash!, settings.salt!);
      if (!ok) {
        setError("Wrong PIN.");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Transport Ledger</h1>
        <p className="mb-4 text-sm text-slate-600">
          {hasPin ? "Enter your 4-digit PIN to continue." : "Set a 4-digit PIN to secure your data."}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder={hasPin ? "PIN" : "New 4-digit PIN"}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          {!hasPin && (
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Confirm PIN"
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" size="lg">
            {hasPin ? "Unlock" : "Set PIN & Enter"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
