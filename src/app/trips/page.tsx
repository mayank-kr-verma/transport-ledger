"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { fmtINR } from "@/lib/inr";
import { Card, Chip, EmptyState, Fab, PageHeader } from "@/components/ui/primitives";
import { Plus, Route, ArrowRight } from "lucide-react";

const statusTone: Record<string, "warning" | "primary" | "success"> = {
  open: "warning",
  completed: "primary",
  settled: "success",
};

export default function TripsPage() {
  const trips = useLiveQuery(() => db.trips.orderBy("tripDate").reverse().toArray(), []);
  const trucks = useLiveQuery(() => db.trucks.toArray(), []);
  const parties = useLiveQuery(() => db.parties.toArray(), []);
  const truckMap = new Map((trucks ?? []).map((t) => [t.id, t.number]));
  const partyMap = new Map((parties ?? []).map((p) => [p.id, p.name]));

  return (
    <div>
      <PageHeader
        title="Trips"
        subtitle={trips ? `${trips.length} recorded` : undefined}
      />

      {trips && trips.length === 0 && (
        <EmptyState
          message="No trips yet. Tap the + button to record your first one."
        />
      )}

      <div className="space-y-3">
        {trips?.map((t, i) => (
          <Link key={t.id} href={`/trips/view/?id=${t.id}`} className={`md-rise md-rise-${Math.min(i + 1, 6)} block`}>
            <Card tone="low" className="md-pressable">
              <div className="mb-3 flex items-center justify-between">
                <Chip tone={statusTone[t.status]}>{t.status}</Chip>
                <span className="text-[12px] text-[var(--md-on-surface-variant)]">{t.tripDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">
                  <Route size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate font-display text-[18px] font-semibold leading-tight">
                    <span className="truncate">{t.fromCity}</span>
                    <ArrowRight size={16} className="shrink-0 text-[var(--md-on-surface-variant)]" />
                    <span className="truncate">{t.toCity}</span>
                  </div>
                  <p className="mt-1 truncate text-[13px] text-[var(--md-on-surface-variant)]">
                    {truckMap.get(t.truckId) ?? "—"} · {partyMap.get(t.partyId) ?? "—"}
                    {t.lrNo ? ` · LR ${t.lrNo}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-[18px] font-semibold">{fmtINR(t.freightAmount)}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Fab
        extended
        icon={<Plus size={20} />}
        onClick={() => (window.location.href = "/trips/new/")}
      >
        New trip
      </Fab>
    </div>
  );
}
