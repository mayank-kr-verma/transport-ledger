"use client";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { Chip, EmptyState, Fab, ListItem, PageHeader } from "@/components/ui/primitives";
import { Plus, Truck as TruckIcon } from "lucide-react";

export default function TrucksPage() {
  const router = useRouter();
  const trucks = useLiveQuery(() => db.trucks.orderBy("number").toArray(), []);
  return (
    <div>
      <PageHeader title="Trucks" subtitle={trucks ? `${trucks.length} total` : undefined} />
      {trucks && trucks.length === 0 && (
        <EmptyState message="No trucks yet. Tap + to add one." />
      )}
      <div className="space-y-2">
        {trucks?.map((t, i) => (
          <div key={t.id} className={`md-rise md-rise-${Math.min(i + 1, 6)}`}>
            <ListItem
              leading={<TruckIcon size={20} />}
              title={t.number}
              supporting={t.ownerName || "—"}
              onClick={() => router.push(`/trucks/edit?id=${t.id}`)}
              trailing={
                <Chip tone={t.type === "owned" ? "primary" : "neutral"}>
                  {t.type === "owned" ? "Owned" : "Market"}
                </Chip>
              }
            />
          </div>
        ))}
      </div>
      <Fab extended icon={<Plus size={20} />} onClick={() => (window.location.href = "/trucks/new/")}>
        Add truck
      </Fab>
    </div>
  );
}
