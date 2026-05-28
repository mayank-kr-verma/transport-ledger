"use client";
import { useEffect, useState } from "react";
import { plOverall, plPerTruck, plPerParty, plPerTrip, type DateRange } from "@/lib/pl";
import { fmtINR } from "@/lib/inr";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui/primitives";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportTablePDF, exportTableXLSX } from "@/lib/export";

type Tab = "overall" | "truck" | "party" | "trip";

function fyStart() {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-04-01`;
}

export default function PLReport() {
  const [range, setRange] = useState<DateRange>({ from: fyStart(), to: new Date().toISOString().slice(0, 10) });
  const [tab, setTab] = useState<Tab>("overall");
  const [overall, setOverall] = useState<Awaited<ReturnType<typeof plOverall>>>();
  const [perTruck, setPerTruck] = useState<Awaited<ReturnType<typeof plPerTruck>>>([]);
  const [perParty, setPerParty] = useState<Awaited<ReturnType<typeof plPerParty>>>([]);
  const [perTrip, setPerTrip] = useState<Awaited<ReturnType<typeof plPerTrip>>>([]);

  useEffect(() => {
    plOverall(range).then(setOverall);
    plPerTruck(range).then(setPerTruck);
    plPerParty(range).then(setPerParty);
    plPerTrip(range).then(setPerTrip);
  }, [range.from, range.to]);

  const exportPDF = async () => {
    const sub = `${range.from} to ${range.to}`;
    if (tab === "overall" && overall) {
      await exportTablePDF({
        title: "P&L Summary",
        subtitle: sub,
        head: ["Metric", "Amount"],
        body: [
          ["Freight Income", fmtINR(overall.income)],
          ["Expenses", fmtINR(overall.expense)],
          ["Driver Pay", fmtINR(overall.driverPay)],
          ["Profit", fmtINR(overall.profit)],
          ["Trips", String(overall.tripCount)],
        ],
        filename: `pl-${range.from}-to-${range.to}.pdf`,
      });
    } else if (tab === "truck") {
      await exportTablePDF({
        title: "P&L — Per Truck",
        subtitle: sub,
        head: ["Truck", "Trips", "Income", "Expense", "Profit"],
        body: perTruck.map((r) => [r.truckNumber, String(r.trips), fmtINR(r.income), fmtINR(r.expense), fmtINR(r.profit)]),
        filename: `pl-truck-${range.from}-to-${range.to}.pdf`,
      });
    } else if (tab === "party") {
      await exportTablePDF({
        title: "P&L — Per Party",
        subtitle: sub,
        head: ["Party", "Trips", "Income"],
        body: perParty.map((r) => [r.partyName, String(r.trips), fmtINR(r.income)]),
        filename: `pl-party-${range.from}-to-${range.to}.pdf`,
      });
    } else if (tab === "trip") {
      await exportTablePDF({
        title: "P&L — Per Trip",
        subtitle: sub,
        head: ["Date", "Truck", "Party", "Route", "Freight"],
        body: perTrip.map((r) => [r.tripDate, r.truckNumber, r.partyName, `${r.fromCity}→${r.toCity}`, fmtINR(r.freightAmount)]),
        filename: `pl-trip-${range.from}-to-${range.to}.pdf`,
      });
    }
  };

  const exportXLSX = async () => {
    const sheetName = tab;
    let rows: Record<string, string | number>[] = [];
    if (tab === "overall" && overall) {
      rows = [
        { metric: "Freight Income", amount: overall.income / 100 },
        { metric: "Expenses", amount: overall.expense / 100 },
        { metric: "Driver Pay", amount: overall.driverPay / 100 },
        { metric: "Profit", amount: overall.profit / 100 },
        { metric: "Trips", amount: overall.tripCount },
      ];
    } else if (tab === "truck") {
      rows = perTruck.map((r) => ({
        truck: r.truckNumber,
        trips: r.trips,
        income: r.income / 100,
        expense: r.expense / 100,
        profit: r.profit / 100,
      }));
    } else if (tab === "party") {
      rows = perParty.map((r) => ({ party: r.partyName, trips: r.trips, income: r.income / 100 }));
    } else {
      rows = perTrip.map((r) => ({
        date: r.tripDate,
        truck: r.truckNumber,
        party: r.partyName,
        from: r.fromCity,
        to: r.toCity,
        freight: r.freightAmount / 100,
        gstPct: r.gstPercent,
      }));
    }
    await exportTableXLSX({ sheetName, rows, filename: `pl-${tab}-${range.from}-to-${range.to}.xlsx` });
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Profit & Loss"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={exportPDF}><FileDown size={14} /> PDF</Button>
            <Button size="sm" variant="secondary" onClick={exportXLSX}><FileSpreadsheet size={14} /> Excel</Button>
          </div>
        }
      />

      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          </Field>
          <Field label="To">
            <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          </Field>
        </div>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-200 p-1">
        {(["overall", "truck", "party", "trip"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-white text-slate-900 shadow" : "text-slate-600"
            }`}
          >
            {t === "overall" ? "Overall" : t === "truck" ? "Per Truck" : t === "party" ? "Per Party" : "Per Trip"}
          </button>
        ))}
      </div>

      {tab === "overall" && overall && (
        <Card>
          <div className="space-y-3">
            <Row label="Freight Income" amount={fmtINR(overall.income)} color="text-green-700" />
            <Row label="Expenses" amount={fmtINR(overall.expense)} color="text-red-700" />
            <Row label="Driver Pay" amount={fmtINR(overall.driverPay)} color="text-amber-700" />
            <div className="border-t border-slate-200 pt-3">
              <Row
                label="Profit"
                amount={fmtINR(overall.profit)}
                color={overall.profit >= 0 ? "text-blue-700" : "text-red-700"}
                big
              />
            </div>
            <p className="text-xs text-slate-500">{overall.tripCount} trips</p>
          </div>
        </Card>
      )}

      {tab === "truck" && (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-1">Truck</th><th>Trips</th><th className="text-right">Income</th><th className="text-right">Expense</th><th className="text-right">Profit</th></tr>
            </thead>
            <tbody>
              {perTruck.map((r) => (
                <tr key={r.truckId} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{r.truckNumber}</td>
                  <td>{r.trips}</td>
                  <td className="text-right text-green-700">{fmtINR(r.income)}</td>
                  <td className="text-right text-red-700">{fmtINR(r.expense)}</td>
                  <td className={`text-right font-semibold ${r.profit >= 0 ? "text-blue-700" : "text-red-700"}`}>{fmtINR(r.profit)}</td>
                </tr>
              ))}
              {perTruck.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-slate-400">No data</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "party" && (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-1">Party</th><th>Trips</th><th className="text-right">Income</th></tr>
            </thead>
            <tbody>
              {perParty.map((r) => (
                <tr key={r.partyId} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{r.partyName}</td>
                  <td>{r.trips}</td>
                  <td className="text-right text-green-700">{fmtINR(r.income)}</td>
                </tr>
              ))}
              {perParty.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400">No data</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "trip" && (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-1">Date</th><th>Truck</th><th>Party</th><th>Route</th><th className="text-right">Freight</th></tr>
            </thead>
            <tbody>
              {perTrip.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2">{r.tripDate}</td>
                  <td>{r.truckNumber}</td>
                  <td>{r.partyName}</td>
                  <td className="text-xs">{r.fromCity}→{r.toCity}</td>
                  <td className="text-right">{fmtINR(r.freightAmount)}</td>
                </tr>
              ))}
              {perTrip.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-slate-400">No data</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Row({ label, amount, color, big }: { label: string; amount: string; color: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={big ? "text-lg font-semibold" : "text-sm text-slate-600"}>{label}</span>
      <span className={`${color} ${big ? "text-2xl font-bold" : "text-base font-semibold"}`}>{amount}</span>
    </div>
  );
}
