"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { partyBalance } from "@/db/ledger";
import { fmtINR } from "@/lib/inr";
import { Button, Card, EmptyState, Fab, Input, ListItem, PageHeader } from "@/components/ui/primitives";
import { Plus, Search, FileText } from "lucide-react";

const AVATAR_COLORS = [
  "bg-orange-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500",
  "bg-teal-500", "bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-pink-500", "bg-lime-600",
];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function PartyRow({
  id,
  name,
  index,
  onBalance,
}: {
  id: number;
  name: string;
  index: number;
  onBalance: (id: number, bal: number) => void;
}) {
  const router = useRouter();
  const bal = useLiveQuery(() => partyBalance(id), [id]);
  useEffect(() => {
    if (bal !== undefined) onBalance(id, bal);
  }, [bal, id, onBalance]);
  const positive = (bal ?? 0) > 0;
  const negative = (bal ?? 0) < 0;
  return (
    <div className={`md-rise md-rise-${Math.min(index + 1, 6)}`}>
      <ListItem
        leading={
          <span className={`flex h-11 w-11 items-center justify-center rounded-full ${avatarColor(name)} text-sm font-bold text-white`}>
            {initials(name) || "?"}
          </span>
        }
        title={name}
        supporting={undefined}
        onClick={() => router.push(`/parties/view/?id=${id}`)}
        trailing={
          <p
            className={
              "font-display text-[16px] font-semibold leading-none " +
              (positive
                ? "text-[var(--md-error)]"
                : negative
                ? "text-[var(--md-tertiary)]"
                : "text-[var(--md-on-surface-variant)]")
            }
          >
            {bal !== undefined ? fmtINR(Math.abs(bal)) : "…"}
          </p>
        }
      />
    </div>
  );
}

export default function PartiesPage() {
  const router = useRouter();
  const parties = useLiveQuery(() => db.parties.orderBy("name").toArray(), []);
  const [q, setQ] = useState("");
  const [balances, setBalances] = useState<Record<number, number>>({});

  const onBalance = (id: number, bal: number) =>
    setBalances((b) => (b[id] === bal ? b : { ...b, [id]: bal }));

  const filtered = useMemo(() => {
    if (!q.trim()) return parties ?? [];
    const needle = q.trim().toLowerCase();
    return (parties ?? []).filter((p) => p.name.toLowerCase().includes(needle));
  }, [parties, q]);

  const totalBalance = useMemo(
    () => Object.values(balances).reduce((a, b) => a + b, 0),
    [balances]
  );

  return (
    <div>
      <PageHeader title="Parties" subtitle={parties ? `${parties.length} total` : undefined} />

      {/* Total balance header */}
      <Card tone="primary" className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-70">Total Party Balance</p>
            <p className={`mt-1 font-display text-[28px] font-semibold leading-none ${
              totalBalance < 0 ? "text-[var(--md-tertiary)]" : ""
            }`}>
              {fmtINR(totalBalance)}
            </p>
            <p className="mt-1 text-[12px] opacity-80">
              {totalBalance > 0 ? "Owed to us" : totalBalance < 0 ? "Advance with us" : "All settled"}
            </p>
          </div>
          <Button variant="tonal" size="sm" onClick={() => router.push("/reports/pl/")}>
            <FileText size={14} /> Report
          </Button>
        </div>
      </Card>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
        <Input
          placeholder="Search by party name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-11"
        />
      </div>

      {parties && parties.length === 0 && (
        <EmptyState message="No parties yet. Tap + to add your first customer." />
      )}
      {parties && parties.length > 0 && filtered.length === 0 && (
        <EmptyState message="No parties match that search." />
      )}

      <div className="space-y-2">
        {filtered.map((p, i) => (
          <PartyRow key={p.id} id={p.id!} name={p.name} index={i} onBalance={onBalance} />
        ))}
      </div>

      <Fab extended icon={<Plus size={20} />} onClick={() => router.push("/parties/new/")}>
        Add party
      </Fab>
    </div>
  );
}
