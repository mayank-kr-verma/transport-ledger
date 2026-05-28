"use client";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { fmtINR } from "@/lib/inr";
import { EmptyState, Fab, ListItem, PageHeader } from "@/components/ui/primitives";
import { Plus, Receipt, Fuel, Wrench, Building2, Tag, CircleDollarSign } from "lucide-react";

const catLabel: Record<string, string> = {
  office: "Office",
  maintenance: "Maintenance",
  fuel: "Fuel",
  toll: "Toll",
  emi: "EMI",
  repair: "Repair",
  misc: "Misc",
};

const catIcon: Record<string, React.ReactNode> = {
  fuel: <Fuel size={20} />,
  maintenance: <Wrench size={20} />,
  repair: <Wrench size={20} />,
  office: <Building2 size={20} />,
  toll: <Tag size={20} />,
  emi: <CircleDollarSign size={20} />,
  misc: <Receipt size={20} />,
};

export default function ExpensesPage() {
  const router = useRouter();
  const expenses = useLiveQuery(() => db.expenses.orderBy("date").reverse().toArray(), []);
  const trucks = useLiveQuery(() => db.trucks.toArray(), []);
  const truckMap = new Map((trucks ?? []).map((t) => [t.id, t.number]));

  return (
    <div>
      <PageHeader title="Expenses" subtitle={expenses ? `${expenses.length} recorded` : undefined} />
      {expenses && expenses.length === 0 && (
        <EmptyState message="No expenses yet. Tap + to record one." />
      )}
      <div className="space-y-2">
        {expenses?.map((e, i) => (
          <div key={e.id} className={`md-rise md-rise-${Math.min(i + 1, 6)}`}>
            <ListItem
              leading={catIcon[e.category]}
              title={catLabel[e.category]}
              supporting={
                <>
                  {e.date}
                  {e.truckId ? ` · ${truckMap.get(e.truckId) ?? ""}` : ""}
                  {e.paidTo ? ` · ${e.paidTo}` : ""}
                </>
              }
              onClick={() => router.push(`/expenses/edit?id=${e.id}`)}
              trailing={
                <p className="font-display text-[16px] font-semibold text-[var(--md-error)]">
                  {fmtINR(e.amount)}
                </p>
              }
            />
          </div>
        ))}
      </div>
      <Fab extended icon={<Plus size={20} />} onClick={() => (window.location.href = "/expenses/new/")}>
        Add expense
      </Fab>
    </div>
  );
}
