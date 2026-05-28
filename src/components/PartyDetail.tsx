"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type DrCr, type LedgerRefType } from "@/db/schema";
import { partyBalance } from "@/db/ledger";
import { fmtINR, toPaise } from "@/lib/inr";
import { Button, Card, Field, Input, Select, PageHeader, EmptyState } from "@/components/ui/primitives";
import { Pencil, Plus, Trash2, FileDown } from "lucide-react";
import { exportTablePDF } from "@/lib/export";

export default function PartyDetail({ id }: { id: number }) {
  const router = useRouter();
  const party = useLiveQuery(() => db.parties.get(id), [id]);
  const entries = useLiveQuery(
    () => db.ledger.where("partyId").equals(id).sortBy("date"),
    [id]
  );
  const balance = useLiveQuery(() => partyBalance(id), [id]);
  const [showAdd, setShowAdd] = useState(false);

  if (party === undefined) return <p className="text-slate-500">Loading…</p>;
  if (party === null || !party) return <p className="text-slate-500">Party not found.</p>;

  // Running balance (chronological)
  let running = party.openingType === "dr" ? party.openingBalance : -party.openingBalance;
  const rows = (entries ?? []).map((e) => {
    running += e.type === "dr" ? e.amount : -e.amount;
    return { ...e, running };
  });

  const onDelEntry = async (entryId?: number) => {
    if (!entryId) return;
    if (!confirm("Delete this entry?")) return;
    await db.ledger.delete(entryId);
  };

  const onExportPDF = async () => {
    const body = rows.map((r) => [
      r.date,
      r.refType,
      r.notes ?? "",
      r.type === "dr" ? fmtINR(r.amount) : "",
      r.type === "cr" ? fmtINR(r.amount) : "",
      fmtINR(r.running),
    ]);
    await exportTablePDF({
      title: `Ledger — ${party.name}`,
      subtitle: `Balance: ${fmtINR(balance ?? 0)} ${(balance ?? 0) >= 0 ? "(Dr)" : "(Cr)"}`,
      head: ["Date", "Ref", "Notes", "Dr ₹", "Cr ₹", "Balance"],
      body,
      filename: `${party.name}-ledger.pdf`,
    });
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={party.name}
        action={
          <Button size="sm" variant="secondary" onClick={() => router.push(`/parties/edit?id=${id}`)}>
            <Pencil size={14} /> Edit
          </Button>
        }
      />
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className={`text-2xl font-bold ${(balance ?? 0) > 0 ? "text-red-700" : (balance ?? 0) < 0 ? "text-green-700" : ""}`}>
              {fmtINR(Math.abs(balance ?? 0))}
            </p>
            <p className="text-xs text-slate-500">
              {balance === undefined ? "" : balance > 0 ? "Party owes us" : balance < 0 ? "We owe party (advance)" : "Settled"}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {party.phone && <p>{party.phone}</p>}
            {party.gstin && <p>{party.gstin}</p>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowAdd((s) => !s)}>
            <Plus size={14} /> Add Entry
          </Button>
          <Button size="sm" variant="secondary" onClick={onExportPDF}>
            <FileDown size={14} /> Export PDF
          </Button>
        </div>
      </Card>

      {showAdd && (
        <AddLedgerEntry
          partyId={id}
          onClose={() => setShowAdd(false)}
        />
      )}

      {(!entries || entries.length === 0) && (
        <EmptyState message="No ledger entries yet. Add a payment, advance, or adjustment, or record a trip for this party." />
      )}

      <div className="space-y-2">
        {rows
          .slice()
          .reverse()
          .map((r) => (
            <Card key={r.id} className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  {r.date} · <span className="capitalize">{r.refType}</span>
                </p>
                <p className="text-sm">{r.notes || (r.refType === "trip" ? "Trip freight" : "—")}</p>
                <p className="text-xs text-slate-500">Balance after: {fmtINR(r.running)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  {r.type === "dr" ? (
                    <p className="text-red-700 font-semibold">Dr {fmtINR(r.amount)}</p>
                  ) : (
                    <p className="text-green-700 font-semibold">Cr {fmtINR(r.amount)}</p>
                  )}
                </div>
                {r.refType !== "trip" && (
                  <button onClick={() => onDelEntry(r.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

function AddLedgerEntry({ partyId, onClose }: { partyId: number; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<DrCr>("cr");
  const [refType, setRefType] = useState<LedgerRefType>("payment");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = toPaise(amount);
    if (!amt) return;
    await db.ledger.add({ partyId, date, type, refType, amount: amt, notes: notes || undefined });
    onClose();
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Amount (₹)">
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as DrCr)}>
              <option value="cr">Cr — payment received / credit</option>
              <option value="dr">Dr — extra charge / debit</option>
            </Select>
          </Field>
          <Field label="Reason">
            <Select value={refType} onChange={(e) => setRefType(e.target.value as LedgerRefType)}>
              <option value="payment">Payment</option>
              <option value="advance">Advance</option>
              <option value="adjustment">Adjustment</option>
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-2 flex gap-2">
          <Button type="submit">Save Entry</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
