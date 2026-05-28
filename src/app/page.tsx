"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { fmtINR } from "@/lib/inr";
import { plOverall } from "@/lib/pl";
import { Card, Button } from "@/components/ui/primitives";
import { MoreLinks } from "@/components/BottomNav";
import { Route, Truck as TruckIcon, Users, Plus } from "lucide-react";

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export default function Dashboard() {
  const r = monthRange();
  const summary = useLiveQuery(() => plOverall(r), [r.from, r.to]);
  const trucks = useLiveQuery(() => db.trucks.count(), []);
  const trips = useLiveQuery(() => db.trips.count(), []);
  const parties = useLiveQuery(() => db.parties.count(), []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">This month at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-slate-500">Freight (Income)</p>
          <p className="mt-1 text-lg font-bold text-green-700">
            {summary ? fmtINR(summary.income) : "…"}
          </p>
          <p className="text-xs text-slate-500">{summary?.tripCount ?? 0} trips</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Expenses</p>
          <p className="mt-1 text-lg font-bold text-red-700">
            {summary ? fmtINR(summary.expense) : "…"}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Driver Pay</p>
          <p className="mt-1 text-lg font-bold text-amber-700">
            {summary ? fmtINR(summary.driverPay) : "…"}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Profit</p>
          <p
            className={`mt-1 text-lg font-bold ${
              (summary?.profit ?? 0) >= 0 ? "text-blue-700" : "text-red-700"
            }`}
          >
            {summary ? fmtINR(summary.profit) : "…"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/trips/new">
          <Card className="flex items-center justify-between hover:bg-blue-50">
            <div className="flex items-center gap-3">
              <Route className="text-blue-600" size={24} />
              <div>
                <p className="font-medium">New Trip</p>
                <p className="text-xs text-slate-500">{trips ?? 0} total</p>
              </div>
            </div>
            <Plus className="text-slate-400" size={20} />
          </Card>
        </Link>
        <Link href="/parties/new">
          <Card className="flex items-center justify-between hover:bg-blue-50">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={24} />
              <div>
                <p className="font-medium">Add Party</p>
                <p className="text-xs text-slate-500">{parties ?? 0} total</p>
              </div>
            </div>
            <Plus className="text-slate-400" size={20} />
          </Card>
        </Link>
        <Link href="/trucks/new">
          <Card className="flex items-center justify-between hover:bg-blue-50">
            <div className="flex items-center gap-3">
              <TruckIcon className="text-blue-600" size={24} />
              <div>
                <p className="font-medium">Add Truck</p>
                <p className="text-xs text-slate-500">{trucks ?? 0} total</p>
              </div>
            </div>
            <Plus className="text-slate-400" size={20} />
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="mb-2 mt-4 text-sm font-semibold text-slate-700">More</h2>
        <MoreLinks />
      </div>

      <Link href="/reports/pl" className="block">
        <Button variant="secondary" className="w-full">
          View full P&L Report
        </Button>
      </Link>
    </div>
  );
}
