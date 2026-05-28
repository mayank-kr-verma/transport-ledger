"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { fmtINR } from "@/lib/inr";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Plus, Receipt } from "lucide-react";

const catLabel: Record<string, string> = {
  office: "Office",
  maintenance: "Maintenance",
  fuel: "Fuel",
  toll: "Toll",
  emi: "EMI",
  repair: "Repair",
  misc: "Misc",
};

export default function ExpensesPage() {
  const expenses = useLiveQuery(() => db.expenses.orderBy("date").reverse().toArray(), []);
  const trucks = useLiveQuery(() => db.trucks.toArray(), []);
  const truckMap = new Map((trucks ?? []).map((t) => [t.id, t.number]));

  return (
    <div>
      <PageHeader
        title="Expenses"
        action={
          <Link href="/expenses/new">
            <Button size="sm"><Plus size={16} /> Add</Button>
          </Link>
        }
      />
      {expenses && expenses.length === 0 && (
        <EmptyState
          message="No expenses yet."
          action={<Link href="/expenses/new"><Button>Record expense</Button></Link>}
        />
      )}
      <div className="space-y-2">
        {expenses?.map((e) => (
          <Link key={e.id} href={`/expenses/edit?id=${e.id}`}>
            <Card className="flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Receipt className="text-slate-500" size={20} />
                <div>
                  <p className="font-medium">{catLabel[e.category]}</p>
                  <p className="text-xs text-slate-500">
                    {e.date}
                    {e.truckId ? ` · ${truckMap.get(e.truckId) ?? ""}` : ""}
                    {e.paidTo ? ` · ${e.paidTo}` : ""}
                  </p>
                </div>
              </div>
              <p className="font-semibold text-red-700">{fmtINR(e.amount)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
