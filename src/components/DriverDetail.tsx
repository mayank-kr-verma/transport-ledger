"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type DriverPayType } from "@/db/schema";
import { fmtINR, toPaise } from "@/lib/inr";
import { Button, Card, Field, Input, Select, PageHeader, EmptyState } from "@/components/ui/primitives";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function DriverDetail({ id }: { id: number }) {
  const router = useRouter();
  const driver = useLiveQuery(() => db.drivers.get(id), [id]);
  const pays = useLiveQuery(
    () => db.driverPay.where("driverId").equals(id).sortBy("date"),
    [id]
  );
  const [showAdd, setShowAdd] = useState(false);

  if (!driver) return <p className="text-slate-500">Driver not found.</p>;

  let running = driver.openingBalance;
  const rows = (pays ?? []).map((p) => {
    running += p.type === "salary" ? p.amount : p.type === "advance" ? -p.amount : p.amount;
    return { ...p, running };
  });
  const balance = running;

  return (
    <div className="space-y-3">
      <PageHeader
        title={driver.name}
        action={
          <Button size="sm" variant="secondary" onClick={() => router.push(`/drivers/edit?id=${id}`)}>
            <Pencil size={14} /> Edit
          </Button>
        }
      />
      <Card>
        <p className="text-xs text-slate-500">Payable to driver</p>
        <p className={`text-2xl font-bold ${balance > 0 ? "text-red-700" : balance < 0 ? "text-green-700" : ""}`}>
          {fmtINR(Math.abs(balance))}
        </p>
        <p className="text-xs text-slate-500">
          {balance > 0 ? "We owe driver" : balance < 0 ? "Driver took advance" : "Settled"}
        </p>
        <div className="mt-3">
          <Button size="sm" onClick={() => setShowAdd((s) => !s)}><Plus size={14} /> Record Payment</Button>
        </div>
      </Card>

      {showAdd && <AddDriverPayment driverId={id} onClose={() => setShowAdd(false)} />}

      {(!pays || pays.length === 0) && <EmptyState message="No payments recorded." />}

      <div className="space-y-2">
        {rows.slice().reverse().map((r) => (
          <Card key={r.id} className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{r.date} · <span className="capitalize">{r.type}</span></p>
              <p className="text-sm">{r.notes || "—"}</p>
              <p className="text-xs text-slate-500">Balance after: {fmtINR(r.running)}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className={r.type === "advance" ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                {r.type === "advance" ? "−" : "+"}{fmtINR(r.amount)}
              </p>
              <button
                onClick={async () => {
                  if (confirm("Delete this payment?")) await db.driverPay.delete(r.id!);
                }}
                className="text-slate-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddDriverPayment({ driverId, onClose }: { driverId: number; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<DriverPayType>("salary");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = toPaise(amount);
    if (!amt) return;
    await db.driverPay.add({ driverId, date, type, amount: amt, notes: notes || undefined });
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
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          </Field>
        </div>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as DriverPayType)}>
            <option value="salary">Salary (we pay driver)</option>
            <option value="advance">Advance (driver took money)</option>
            <option value="adjustment">Adjustment</option>
          </Select>
        </Field>
        <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="mt-2 flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
