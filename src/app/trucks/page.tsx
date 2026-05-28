"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Plus, Truck as TruckIcon } from "lucide-react";

export default function TrucksPage() {
  const trucks = useLiveQuery(() => db.trucks.orderBy("number").toArray(), []);
  return (
    <div>
      <PageHeader
        title="Trucks"
        action={
          <Link href="/trucks/new">
            <Button size="sm">
              <Plus size={16} /> Add
            </Button>
          </Link>
        }
      />
      {trucks && trucks.length === 0 && (
        <EmptyState
          message="No trucks yet."
          action={
            <Link href="/trucks/new">
              <Button>Add your first truck</Button>
            </Link>
          }
        />
      )}
      <div className="space-y-2">
        {trucks?.map((t) => (
          <Link key={t.id} href={`/trucks/edit?id=${t.id}`}>
            <Card className="flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <TruckIcon className="text-slate-500" size={20} />
                <div>
                  <p className="font-medium">{t.number}</p>
                  <p className="text-xs text-slate-500">
                    {t.type === "owned" ? "Owned" : "Market"}
                    {t.ownerName ? ` · ${t.ownerName}` : ""}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
