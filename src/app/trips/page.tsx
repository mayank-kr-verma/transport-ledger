"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { fmtINR } from "@/lib/inr";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Plus, Route } from "lucide-react";

const statusBadge: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  completed: "bg-blue-100 text-blue-800",
  settled: "bg-green-100 text-green-800",
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
        action={
          <Link href="/trips/new">
            <Button size="sm"><Plus size={16} /> New Trip</Button>
          </Link>
        }
      />
      {trips && trips.length === 0 && (
        <EmptyState
          message="No trips yet."
          action={<Link href="/trips/new"><Button>Record first trip</Button></Link>}
        />
      )}
      <div className="space-y-2">
        {trips?.map((t) => (
          <Link key={t.id} href={`/trips/edit?id=${t.id}`}>
            <Card className="hover:bg-slate-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Route className="mt-1 text-slate-500" size={20} />
                  <div>
                    <p className="font-medium">{t.fromCity} → {t.toCity}</p>
                    <p className="text-xs text-slate-500">
                      {t.tripDate} · {truckMap.get(t.truckId) ?? "—"} · {partyMap.get(t.partyId) ?? "—"}
                      {t.lrNo ? ` · LR ${t.lrNo}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmtINR(t.freightAmount)}</p>
                  <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${statusBadge[t.status]}`}>{t.status}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
