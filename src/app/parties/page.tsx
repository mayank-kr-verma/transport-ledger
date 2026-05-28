"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { partyBalance } from "@/db/ledger";
import { fmtINR } from "@/lib/inr";
import { EmptyState, Fab, ListItem, PageHeader } from "@/components/ui/primitives";
import { Plus, Users } from "lucide-react";

function PartyRow({ id, name, gstin, index }: { id: number; name: string; gstin?: string; index: number }) {
  const router = useRouter();
  const bal = useLiveQuery(() => partyBalance(id), [id]);
  const positive = (bal ?? 0) > 0;
  const negative = (bal ?? 0) < 0;
  return (
    <div className={`md-rise md-rise-${Math.min(index + 1, 6)}`}>
      <ListItem
        leading={<Users size={20} />}
        title={name}
        supporting={gstin || "No GSTIN"}
        onClick={() => router.push(`/parties/view?id=${id}`)}
        trailing={
          <div>
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
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--md-on-surface-variant)]">
              {bal === undefined ? "" : positive ? "owes us" : negative ? "advance" : "settled"}
            </p>
          </div>
        }
      />
    </div>
  );
}

export default function PartiesPage() {
  const parties = useLiveQuery(() => db.parties.orderBy("name").toArray(), []);
  return (
    <div>
      <PageHeader title="Parties" subtitle={parties ? `${parties.length} total` : undefined} />
      {parties && parties.length === 0 && (
        <EmptyState message="No parties yet. Tap + to add your first customer." />
      )}
      <div className="space-y-2">
        {parties?.map((p, i) => <PartyRow key={p.id} id={p.id!} name={p.name} gstin={p.gstin} index={i} />)}
      </div>
      <Fab extended icon={<Plus size={20} />} onClick={() => (window.location.href = "/parties/new/")}>
        Add party
      </Fab>
      <Link href="/parties/new" className="hidden" aria-hidden />
    </div>
  );
}
