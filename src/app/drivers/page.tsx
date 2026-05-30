"use client";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { fmtINR } from "@/lib/inr";
import { EmptyState, Fab, ListItem, PageHeader } from "@/components/ui/primitives";
import { Plus, UserCog } from "lucide-react";

async function driverBalance(driverId: number): Promise<number> {
  const d = await db.drivers.get(driverId);
  if (!d) return 0;
  const pays = await db.driverPay.where("driverId").equals(driverId).toArray();
  return pays.reduce(
    (a, p) => a + (p.type === "salary" ? p.amount : p.type === "advance" ? -p.amount : p.amount),
    d.openingBalance
  );
}

function DriverRow({ id, name, phone, index }: { id: number; name: string; phone?: string; index: number }) {
  const router = useRouter();
  const bal = useLiveQuery(() => driverBalance(id), [id]);
  return (
    <div className={`md-rise md-rise-${Math.min(index + 1, 6)}`}>
      <ListItem
        leading={<UserCog size={20} />}
        title={name}
        supporting={phone || "—"}
        onClick={() => router.push(`/drivers/view/?id=${id}`)}
        trailing={
          <div>
            <p
              className={
                "font-display text-[16px] font-semibold leading-none " +
                ((bal ?? 0) > 0 ? "text-[var(--md-error)]" : "text-[var(--md-on-surface-variant)]")
              }
            >
              {bal !== undefined ? fmtINR(Math.abs(bal)) : "…"}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--md-on-surface-variant)]">
              {bal === undefined ? "" : bal > 0 ? "payable" : bal < 0 ? "advance" : "settled"}
            </p>
          </div>
        }
      />
    </div>
  );
}

export default function DriversPage() {
  const router = useRouter();
  const drivers = useLiveQuery(() => db.drivers.orderBy("name").toArray(), []);
  return (
    <div>
      <PageHeader title="Drivers" subtitle={drivers ? `${drivers.length} total` : undefined} />
      {drivers && drivers.length === 0 && (
        <EmptyState message="No drivers yet. Tap + to add." />
      )}
      <div className="space-y-2">
        {drivers?.map((d, i) => <DriverRow key={d.id} id={d.id!} name={d.name} phone={d.phone} index={i} />)}
      </div>
      <Fab extended icon={<Plus size={20} />} onClick={() => router.push("/drivers/new/")}>
        Add driver
      </Fab>
    </div>
  );
}
