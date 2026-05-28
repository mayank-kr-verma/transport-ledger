import { db, type Trip } from "@/db/schema";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}

export interface PLSummary {
  income: number;
  expense: number;
  driverPay: number;
  profit: number;
  tripCount: number;
}

const inRange = (date: string, r: DateRange) => date >= r.from && date <= r.to;

export async function plOverall(r: DateRange): Promise<PLSummary> {
  const trips = await db.trips.toArray();
  const expenses = await db.expenses.toArray();
  const pays = await db.driverPay.where("type").equals("salary").toArray();

  const ft = trips.filter((t) => inRange(t.tripDate, r));
  const income = ft.reduce((a, t) => a + t.freightAmount, 0);
  const expense = expenses.filter((e) => inRange(e.date, r)).reduce((a, e) => a + e.amount, 0);
  const driverPay = pays.filter((p) => inRange(p.date, r)).reduce((a, p) => a + p.amount, 0);
  return {
    income,
    expense,
    driverPay,
    profit: income - expense - driverPay,
    tripCount: ft.length,
  };
}

export interface PerTruckRow {
  truckId: number;
  truckNumber: string;
  income: number;
  expense: number;
  trips: number;
  profit: number;
}

export async function plPerTruck(r: DateRange): Promise<PerTruckRow[]> {
  const [trucks, trips, expenses] = await Promise.all([
    db.trucks.toArray(),
    db.trips.toArray(),
    db.expenses.toArray(),
  ]);
  return trucks
    .map((tr) => {
      const ts = trips.filter((t) => t.truckId === tr.id && inRange(t.tripDate, r));
      const es = expenses.filter((e) => e.truckId === tr.id && inRange(e.date, r));
      const income = ts.reduce((a, t) => a + t.freightAmount, 0);
      const expense = es.reduce((a, e) => a + e.amount, 0);
      return {
        truckId: tr.id!,
        truckNumber: tr.number,
        income,
        expense,
        trips: ts.length,
        profit: income - expense,
      };
    })
    .sort((a, b) => b.profit - a.profit);
}

export interface PerPartyRow {
  partyId: number;
  partyName: string;
  income: number;
  trips: number;
}

export async function plPerParty(r: DateRange): Promise<PerPartyRow[]> {
  const [parties, trips] = await Promise.all([db.parties.toArray(), db.trips.toArray()]);
  return parties
    .map((p) => {
      const ts = trips.filter((t) => t.partyId === p.id && inRange(t.tripDate, r));
      return {
        partyId: p.id!,
        partyName: p.name,
        income: ts.reduce((a, t) => a + t.freightAmount, 0),
        trips: ts.length,
      };
    })
    .filter((r) => r.trips > 0)
    .sort((a, b) => b.income - a.income);
}

export interface PerTripRow extends Trip {
  truckNumber: string;
  partyName: string;
}

export async function plPerTrip(r: DateRange): Promise<PerTripRow[]> {
  const [trips, trucks, parties] = await Promise.all([
    db.trips.toArray(),
    db.trucks.toArray(),
    db.parties.toArray(),
  ]);
  const tMap = new Map(trucks.map((t) => [t.id!, t.number]));
  const pMap = new Map(parties.map((p) => [p.id!, p.name]));
  return trips
    .filter((t) => inRange(t.tripDate, r))
    .map((t) => ({
      ...t,
      truckNumber: tMap.get(t.truckId) ?? "-",
      partyName: pMap.get(t.partyId) ?? "-",
    }))
    .sort((a, b) => (a.tripDate < b.tripDate ? 1 : -1));
}
