"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import {
  addTripAdvance,
  addTripCharge,
  addTripPayment,
  deleteTripAdvance,
  deleteTripCascade,
  deleteTripCharge,
  deleteTripPayment,
  tripPendingBalance,
} from "@/db/ledger";
import { fmtINR, toPaise } from "@/lib/inr";
import {
  Button,
  Card,
  Chip,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui/primitives";
import { ArrowRight, Pencil, Plus, Trash2, X } from "lucide-react";

type SubTab = "party" | "driver" | "more";

export default function TripDetail({ id }: { id: number }) {
  const router = useRouter();
  const trip = useLiveQuery(() => db.trips.get(id), [id]);
  const party = useLiveQuery(async () => (trip ? await db.parties.get(trip.partyId) : undefined), [trip?.partyId]);
  const truck = useLiveQuery(async () => (trip ? await db.trucks.get(trip.truckId) : undefined), [trip?.truckId]);
  const driver = useLiveQuery(async () => (trip?.driverId ? await db.drivers.get(trip.driverId) : undefined), [trip?.driverId]);

  const advances = useLiveQuery(() => db.tripAdvances.where({ tripId: id }).sortBy("date"), [id]);
  const charges = useLiveQuery(() => db.tripCharges.where({ tripId: id }).sortBy("date"), [id]);
  const payments = useLiveQuery(() => db.tripPayments.where({ tripId: id }).sortBy("date"), [id]);
  const summary = useLiveQuery(() => tripPendingBalance(id), [id, advances?.length, charges?.length, payments?.length, trip?.freightAmount, trip?.gstPercent]);

  const [tab, setTab] = useState<SubTab>("party");
  const [sheet, setSheet] = useState<"advance" | "charge" | "payment" | null>(null);

  if (trip === undefined) return <p className="text-[var(--md-on-surface-variant)]">Loading…</p>;
  if (!trip) return <p className="text-[var(--md-on-surface-variant)]">Trip not found.</p>;

  const onMarkComplete = async () => {
    await db.trips.update(id, { status: "completed" });
  };
  const onMarkSettled = async () => {
    await db.trips.update(id, { status: "settled" });
  };
  const onDelete = async () => {
    if (!confirm("Delete this trip and all linked advances/charges/payments/ledger entries?")) return;
    await deleteTripCascade(id);
    router.push("/trips/");
  };

  const StatusStep = ({ active, label }: { active: boolean; label: string }) => (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          active ? "bg-[var(--md-tertiary)]" : "bg-[var(--md-outline-variant)]"
        }`}
      />
      <span
        className={`text-[10px] font-semibold uppercase tracking-[0.04em] ${
          active ? "text-[var(--md-on-surface)]" : "text-[var(--md-on-surface-variant)]"
        }`}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Trip Details"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="tonal" onClick={() => router.push(`/trips/edit/?id=${id}`)}>
              <Pencil size={14} /> Edit
            </Button>
          </div>
        }
      />

      {/* Truck + driver header */}
      <Card tone="high">
        <div className="flex items-center justify-between">
          <p className="font-display text-[18px] font-semibold">{truck?.number ?? "—"}</p>
          <p className="text-[14px] text-[var(--md-on-surface-variant)]">{driver?.name ?? "No driver"}</p>
        </div>
      </Card>

      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-[var(--md-surface-container-high)] p-1">
        {(["party", "driver", "more"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? "bg-[var(--md-surface-container-lowest)] text-[var(--md-on-surface)] shadow-sm"
                : "text-[var(--md-on-surface-variant)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "party" && (
        <>
          {/* Party + route summary */}
          <Card tone="low">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-semibold">{party?.name ?? "—"}</p>
              <p className="font-display text-[18px] font-semibold">{fmtINR(trip.freightAmount)}</p>
            </div>
            <div className="flex items-center gap-2 text-[15px]">
              <span className="font-display font-semibold">{trip.fromCity}</span>
              <ArrowRight size={14} className="text-[var(--md-on-surface-variant)]" />
              <span className="font-display font-semibold">{trip.toCity}</span>
              {trip.lrNo && <span className="ml-auto text-[12px] text-[var(--md-on-surface-variant)]">LR {trip.lrNo}</span>}
            </div>

            {/* Status stepper */}
            <div className="mt-4 flex gap-2">
              <StatusStep active={true} label="Started" />
              <StatusStep active={trip.status === "completed" || trip.status === "settled"} label="Completed" />
              <StatusStep active={!!trip.podReceived || trip.status === "settled"} label="POD Recv" />
              <StatusStep active={!!trip.podSubmitted || trip.status === "settled"} label="POD Subm" />
              <StatusStep active={trip.status === "settled"} label="Settled" />
            </div>

            <div className="mt-4 flex gap-2">
              {trip.status === "open" && (
                <Button size="sm" variant="tonal" onClick={onMarkComplete}>Mark Completed</Button>
              )}
              {trip.status === "completed" && (
                <Button size="sm" onClick={onMarkSettled}>Mark Settled</Button>
              )}
              <Chip tone={trip.status === "open" ? "warning" : trip.status === "settled" ? "success" : "primary"}>
                {trip.status}
              </Chip>
            </div>
          </Card>

          {/* Money breakdown */}
          <Card tone="low">
            <Row label={`Freight Amount`} value={fmtINR(trip.freightAmount)} />
            {trip.gstPercent > 0 && summary && (
              <Row label={`GST ${trip.gstPercent}%`} value={fmtINR(summary.gst)} muted />
            )}
            <Section
              label="Advance"
              total={summary?.advances ?? 0}
              sign="−"
              items={(advances ?? []).map((a) => ({
                id: a.id!,
                title: a.paidTo || a.notes || "Advance",
                date: a.date,
                amount: a.amount,
                onDelete: () => deleteTripAdvance(a.id!),
              }))}
              onAdd={() => setSheet("advance")}
            />
            <Section
              label="Charges"
              total={summary?.charges ?? 0}
              sign="+"
              items={(charges ?? []).map((c) => ({
                id: c.id!,
                title: c.label,
                date: c.date,
                amount: c.amount,
                onDelete: () => deleteTripCharge(c.id!),
              }))}
              onAdd={() => setSheet("charge")}
            />
            <Section
              label="Payments"
              total={summary?.payments ?? 0}
              sign="−"
              items={(payments ?? []).map((p) => ({
                id: p.id!,
                title: p.mode || p.notes || "Payment",
                date: p.date,
                amount: p.amount,
                onDelete: () => deleteTripPayment(p.id!),
              }))}
              onAdd={() => setSheet("payment")}
            />
            <div className="mt-4 flex items-center justify-between border-t border-[var(--md-outline-variant)] pt-3">
              <p className="font-display text-[15px] font-semibold">Pending Balance</p>
              <p
                className={`font-display text-[24px] font-semibold ${
                  (summary?.pending ?? 0) > 0
                    ? "text-[var(--md-primary)]"
                    : (summary?.pending ?? 0) < 0
                    ? "text-[var(--md-tertiary)]"
                    : ""
                }`}
              >
                {summary ? fmtINR(summary.pending) : "—"}
              </p>
            </div>
            {trip.notes && (
              <p className="mt-3 text-[13px] text-[var(--md-on-surface-variant)]">📝 {trip.notes}</p>
            )}
          </Card>
        </>
      )}

      {tab === "driver" && (
        <Card tone="low">
          <p className="text-[13px] text-[var(--md-on-surface-variant)]">Driver</p>
          <p className="font-display text-[18px] font-semibold">{driver?.name ?? "No driver assigned"}</p>
          {driver?.phone && <p className="mt-1 text-[14px] text-[var(--md-on-surface-variant)]">{driver.phone}</p>}
          {driver && (
            <Button
              variant="tonal"
              size="sm"
              className="mt-3"
              onClick={() => router.push(`/drivers/view/?id=${driver.id}`)}
            >
              Open driver page
            </Button>
          )}
        </Card>
      )}

      {tab === "more" && (
        <Card tone="low">
          <Button variant="danger" onClick={onDelete}>
            <Trash2 size={16} /> Delete Trip
          </Button>
        </Card>
      )}

      {sheet && (
        <AddSubEntry
          kind={sheet}
          tripId={id}
          tripDate={trip.tripDate}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${muted ? "text-[var(--md-on-surface-variant)]" : ""}`}>
      <p className="text-[14px]">{label}</p>
      <p className="font-display text-[15px] font-semibold">{value}</p>
    </div>
  );
}

function Section({
  label,
  total,
  sign,
  items,
  onAdd,
}: {
  label: string;
  total: number;
  sign: "+" | "−";
  items: { id: number; title: string; date: string; amount: number; onDelete: () => void }[];
  onAdd: () => void;
}) {
  return (
    <div className="mt-3 border-t border-[var(--md-outline-variant)]/60 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold">
          <span className="mr-1 text-[var(--md-on-surface-variant)]">({sign})</span>
          {label}
        </p>
        <p className="font-display text-[15px] font-semibold">{fmtINR(total)}</p>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between text-[13px] text-[var(--md-on-surface-variant)]">
              <span className="truncate">
                {it.date} · {it.title}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-medium text-[var(--md-on-surface)]">{fmtINR(it.amount)}</span>
                <button
                  onClick={() => {
                    if (confirm(`Delete this ${label.toLowerCase()} entry?`)) it.onDelete();
                  }}
                  className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-error)]"
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={onAdd}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--md-primary)]"
      >
        <Plus size={14} /> Add {label.toLowerCase()}
      </button>
    </div>
  );
}

function AddSubEntry({
  kind,
  tripId,
  tripDate,
  onClose,
}: {
  kind: "advance" | "charge" | "payment";
  tripId: number;
  tripDate: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState(tripDate);
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState(""); // for charge
  const [paidTo, setPaidTo] = useState(""); // for advance
  const [mode, setMode] = useState("cash"); // for payment
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = toPaise(amount);
    if (!amt) return;
    if (kind === "advance") {
      await addTripAdvance({ tripId, date, amount: amt, paidTo: paidTo || undefined, notes: notes || undefined });
    } else if (kind === "charge") {
      await addTripCharge({ tripId, date, amount: amt, label: label.trim() || "Charge", notes: notes || undefined });
    } else {
      await addTripPayment({ tripId, date, amount: amt, mode, notes: notes || undefined });
    }
    onClose();
  };

  const title = kind === "advance" ? "Add Advance" : kind === "charge" ? "Add Charge" : "Add Payment";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-[28px] bg-[var(--md-surface)] p-5 sm:rounded-[28px] md-safe-bottom">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--md-outline-variant)] sm:hidden" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[20px] font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--md-surface-container-high)]"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Amount (₹)">
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
            </Field>
          </div>
          {kind === "advance" && (
            <Field label="Paid To (e.g. driver, agent)">
              <Input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
            </Field>
          )}
          {kind === "charge" && (
            <Field label="Label (e.g. Detention, Loading)">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </Field>
          )}
          {kind === "payment" && (
            <Field label="Mode">
              <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </Select>
            </Field>
          )}
          <Field label="Notes">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="mt-3 flex gap-2">
            <Button type="submit" className="flex-1">Save</Button>
            <Button type="button" variant="outlined" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
