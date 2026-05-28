"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { fmtINR } from "@/lib/inr";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Plus, UserCog } from "lucide-react";

async function driverBalance(driverId: number): Promise<number> {
  const d = await db.drivers.get(driverId);
  if (!d) return 0;
  const pays = await db.driverPay.where("driverId").equals(driverId).toArray();
  // positive = we owe driver. salary increases, advance decreases.
  return pays.reduce(
    (a, p) => a + (p.type === "salary" ? p.amount : p.type === "advance" ? -p.amount : p.amount),
    d.openingBalance
  );
}

function DriverRow({ id, name, phone }: { id: number; name: string; phone?: string }) {
  const bal = useLiveQuery(() => driverBalance(id), [id]);
  return (
    <Link href={`/drivers/view?id=${id}`}>
      <Card className="flex items-center justify-between hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <UserCog className="text-slate-500" size={20} />
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-slate-500">{phone || "—"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${(bal ?? 0) > 0 ? "text-red-700" : ""}`}>
            {bal !== undefined ? fmtINR(Math.abs(bal)) : "…"}
          </p>
          <p className="text-xs text-slate-500">
            {bal === undefined ? "" : bal > 0 ? "Payable" : bal < 0 ? "Advance out" : "Settled"}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export default function DriversPage() {
  const drivers = useLiveQuery(() => db.drivers.orderBy("name").toArray(), []);
  return (
    <div>
      <PageHeader
        title="Drivers"
        action={
          <Link href="/drivers/new">
            <Button size="sm"><Plus size={16} /> Add</Button>
          </Link>
        }
      />
      {drivers && drivers.length === 0 && (
        <EmptyState
          message="No drivers yet."
          action={<Link href="/drivers/new"><Button>Add driver</Button></Link>}
        />
      )}
      <div className="space-y-2">
        {drivers?.map((d) => <DriverRow key={d.id} id={d.id!} name={d.name} phone={d.phone} />)}
      </div>
    </div>
  );
}
