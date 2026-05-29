"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type DrCr, type LedgerRefType, type TripStatus } from "@/db/schema";
import { partyBalance } from "@/db/ledger";
import { fmtINR, toPaise } from "@/lib/inr";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui/primitives";
import { Pencil, Plus, Trash2, FileDown, Search, SlidersHorizontal, ArrowRight, X } from "lucide-react";
import { exportTablePDF } from "@/lib/export";

type Tab = "trips" | "passbook";

const statusToneFor: Record<TripStatus, "warning" | "primary" | "success"> = {
  open: "warning",
  completed: "primary",
  settled: "success",
};

export default function PartyDetail({ id }: { id: number }) {
  const router = useRouter();
  const party = useLiveQuery(() => db.parties.get(id), [id]);
  const balance = useLiveQuery(() => partyBalance(id), [id]);
  const ledgerRows = useLiveQuery(
    () => db.ledger.where("partyId").equals(id).sortBy("date"),
    [id]
  );
  const trips = useLiveQuery(
    () => db.trips.where("partyId").equals(id).reverse().sortBy("tripDate"),
    [id]
  );
  const trucks = useLiveQuery(() => db.trucks.toArray(), []);
  const truckMap = new Map((trucks ?? []).map((t) => [t.id, t.number]));

  const [tab, setTab] = useState<Tab>("trips");
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tripQ, setTripQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | TripStatus>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  if (party === undefined) return <p className="text-[var(--md-on-surface-variant)]">Loading…</p>;
  if (!party) return <p className="text-[var(--md-on-surface-variant)]">Party not found.</p>;

  // Running balance for ledger
  let running = party.openingType === "dr" ? party.openingBalance : -party.openingBalance;
  const ledgerWithRunning = (ledgerRows ?? []).map((e) => {
    running += e.type === "dr" ? e.amount : -e.amount;
    return { ...e, running };
  });

  // Filtered trips
  const filteredTrips = useMemo(() => {
    let rows = trips ?? [];
    if (tripQ.trim()) {
      const q = tripQ.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.fromCity.toLowerCase().includes(q) ||
          t.toCity.toLowerCase().includes(q) ||
          (t.lrNo ?? "").toLowerCase().includes(q) ||
          (truckMap.get(t.truckId) ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter) rows = rows.filter((t) => t.status === statusFilter);
    if (from) rows = rows.filter((t) => t.tripDate >= from);
    if (to) rows = rows.filter((t) => t.tripDate <= to);
    return rows;
  }, [trips, tripQ, statusFilter, from, to, truckMap]);

  const onDelEntry = async (entryId?: number) => {
    if (!entryId) return;
    if (!confirm("Delete this entry?")) return;
    await db.ledger.delete(entryId);
  };

  const onExportPDF = async () => {
    const body = ledgerWithRunning.map((r) => [
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

  const filtersActive = !!(statusFilter || from || to);

  return (
    <div className="space-y-3">
      <PageHeader
        title={party.name}
        action={
          <Button size="sm" variant="tonal" onClick={() => router.push(`/parties/edit/?id=${id}`)}>
            <Pencil size={14} /> Edit
          </Button>
        }
      />

      {/* Balance card */}
      <Card tone="primary">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-70">Party Balance</p>
        <p
          className={`mt-1 font-display text-[32px] font-semibold leading-none ${
            (balance ?? 0) > 0
              ? ""
              : (balance ?? 0) < 0
              ? "text-[var(--md-tertiary)]"
              : "opacity-80"
          }`}
        >
          {fmtINR(Math.abs(balance ?? 0))}
        </p>
        <p className="mt-1 text-[12px] opacity-80">
          {balance === undefined ? "" : balance > 0 ? "Party owes us" : balance < 0 ? "Advance with us" : "Settled"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowAdd((s) => !s)}>
            <Plus size={14} /> Add Entry
          </Button>
          <Button size="sm" variant="tonal" onClick={onExportPDF}>
            <FileDown size={14} /> PDF
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-[var(--md-surface-container-high)] p-1">
        {(["trips", "passbook"] as Tab[]).map((t) => (
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

      {tab === "trips" && (
        <>
          {/* Search + Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
              <Input
                placeholder="Search trips"
                value={tripQ}
                onChange={(e) => setTripQ(e.target.value)}
                className="pl-11"
              />
            </div>
            <Button
              variant="outlined"
              onClick={() => setShowFilters(true)}
              className="!h-14 !px-4"
            >
              <SlidersHorizontal size={18} />
              {filtersActive && <span className="ml-1 h-2 w-2 rounded-full bg-[var(--md-primary)]" />}
            </Button>
          </div>

          {filteredTrips.length === 0 && (
            <EmptyState message={trips?.length === 0 ? "No trips for this party yet." : "No trips match these filters."} />
          )}

          <div className="space-y-2">
            {filteredTrips.map((t, i) => (
              <div key={t.id} className={`md-rise md-rise-${Math.min(i + 1, 6)}`}>
                <Card tone="low" className="md-pressable cursor-pointer" >
                  <div onClick={() => router.push(`/trips/view/?id=${t.id}`)}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-[var(--md-on-surface-variant)]">
                        {truckMap.get(t.truckId) ?? "—"}
                      </p>
                      <Chip tone={statusToneFor[t.status]}>{t.status}</Chip>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[16px] font-semibold">{t.fromCity}</span>
                      <ArrowRight size={14} className="text-[var(--md-on-surface-variant)]" />
                      <span className="font-display text-[16px] font-semibold">{t.toCity}</span>
                      <span className="ml-auto font-display text-[16px] font-semibold">
                        {fmtINR(t.freightAmount)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--md-on-surface-variant)]">
                      {t.tripDate}
                      {t.lrNo ? ` · LR ${t.lrNo}` : ""}
                    </p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "passbook" && (
        <>
          {showAdd && <AddLedgerEntry partyId={id} onClose={() => setShowAdd(false)} />}
          {(!ledgerRows || ledgerRows.length === 0) && (
            <EmptyState message="No ledger entries yet. Add a payment, advance, or adjustment, or record a trip for this party." />
          )}
          <div className="space-y-2">
            {ledgerWithRunning
              .slice()
              .reverse()
              .map((r) => (
                <Card key={r.id} tone="low" className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-[var(--md-on-surface-variant)]">
                      {r.date} · <span className="capitalize">{r.refType}</span>
                    </p>
                    <p className="text-sm">{r.notes || (r.refType === "trip" ? "Trip freight" : "—")}</p>
                    <p className="text-[12px] text-[var(--md-on-surface-variant)]">
                      Balance after: {fmtINR(r.running)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={
                        r.type === "dr"
                          ? "font-display text-[15px] font-semibold text-[var(--md-error)]"
                          : "font-display text-[15px] font-semibold text-[var(--md-tertiary)]"
                      }
                    >
                      {r.type === "dr" ? "Dr" : "Cr"} {fmtINR(r.amount)}
                    </p>
                    {r.refType !== "trip" && r.refType !== "charge" && r.refType !== "payment" && r.refType !== "advance" && (
                      <button
                        onClick={() => onDelEntry(r.id)}
                        className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-error)]"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </>
      )}

      {/* Filters sheet */}
      {showFilters && (
        <FiltersSheet
          status={statusFilter}
          setStatus={setStatusFilter}
          from={from}
          setFrom={setFrom}
          to={to}
          setTo={setTo}
          onClose={() => setShowFilters(false)}
          onClear={() => {
            setStatusFilter("");
            setFrom("");
            setTo("");
          }}
        />
      )}
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
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Amount (₹)"><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as DrCr)}>
              <option value="cr">Cr — payment received</option>
              <option value="dr">Dr — extra charge</option>
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
        <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="mt-2 flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outlined" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

function FiltersSheet({
  status, setStatus, from, setFrom, to, setTo, onClose, onClear,
}: {
  status: "" | TripStatus;
  setStatus: (s: "" | TripStatus) => void;
  from: string; setFrom: (s: string) => void;
  to: string; setTo: (s: string) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-[28px] bg-[var(--md-surface)] p-5 sm:rounded-[28px] md-safe-bottom">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--md-outline-variant)] sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[20px] font-semibold">Filters</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--md-surface-container-high)]"><X size={20} /></button>
        </div>
        <Field label="Trip Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as "" | TripStatus)}>
            <option value="">Any</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="settled">Settled</option>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outlined" onClick={onClear} className="flex-1">Clear</Button>
          <Button onClick={onClose} className="flex-1">Apply</Button>
        </div>
      </div>
    </div>
  );
}
