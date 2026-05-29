import Dexie, { type Table } from "dexie";

export type TruckType = "owned" | "market";
export interface Truck {
  id?: number;
  number: string;
  type: TruckType;
  ownerName?: string;
  registrationDate?: string;
  notes?: string;
}

export type DrCr = "dr" | "cr";
export interface Party {
  id?: number;
  name: string;
  gstin?: string;
  phone?: string;
  address?: string;
  openingBalance: number; // paise
  openingType: DrCr;
}

export interface Driver {
  id?: number;
  name: string;
  phone?: string;
  licenseNo?: string;
  joiningDate?: string;
  openingBalance: number;
}

export type TripStatus = "open" | "completed" | "settled";
export interface Trip {
  id?: number;
  tripDate: string;
  lrNo?: string;
  truckId: number;
  partyId: number;
  driverId?: number;
  fromCity: string;
  toCity: string;
  freightAmount: number; // paise
  gstPercent: number;
  advance: number;       // paise — kept for back-compat; superseded by tripAdvances rows
  status: TripStatus;
  notes?: string;
  podReceived?: boolean;
  podSubmitted?: boolean;
}

export interface TripAdvance {
  id?: number;
  tripId: number;
  date: string;
  amount: number; // paise
  paidTo?: string;
  notes?: string;
}
export interface TripCharge {
  id?: number;
  tripId: number;
  date: string;
  label: string;
  amount: number; // paise
  notes?: string;
}
export interface TripPayment {
  id?: number;
  tripId: number;
  date: string;
  amount: number; // paise
  mode?: string;
  notes?: string;
}

/* Expense — extended in v2.
   scope = trip | truck | office (top-level intent)
   category = fuel | toll | maintenance | repair | emi | office | misc (sub-type)
*/
export type ExpenseScope = "trip" | "truck" | "office";
export type ExpenseCategory =
  | "office"
  | "maintenance"
  | "fuel"
  | "toll"
  | "emi"
  | "repair"
  | "misc";
export interface Expense {
  id?: number;
  date: string;
  scope: ExpenseScope;
  category: ExpenseCategory;
  truckId?: number;
  tripId?: number;
  amount: number; // paise — for fuel: amount = qty * ratePerLitre
  paidTo?: string;
  paymentMode?: string;
  notes?: string;
  // Fuel-specific
  fuelQuantity?: number;       // litres (decimal allowed)
  fuelRatePerLitre?: number;   // paise per litre
  kmReading?: number;          // odometer (decimal allowed)
  fullTank?: boolean;
}

export type LedgerRefType =
  | "trip"
  | "payment"
  | "advance"
  | "charge"
  | "adjustment"
  | "opening";
export interface LedgerEntry {
  id?: number;
  date: string;
  partyId: number;
  type: DrCr;
  amount: number;
  refType: LedgerRefType;
  refId?: number;
  notes?: string;
}

export type DriverPayType = "salary" | "advance" | "adjustment";
export interface DriverPayment {
  id?: number;
  date: string;
  driverId: number;
  type: DriverPayType;
  amount: number;
  notes?: string;
}

export interface Settings {
  id: number;
  businessName: string;
  businessGstin?: string;
  pinHash?: string;
  salt?: string;
  lastBackupAt?: string;
}

class TLDB extends Dexie {
  trucks!: Table<Truck, number>;
  parties!: Table<Party, number>;
  drivers!: Table<Driver, number>;
  trips!: Table<Trip, number>;
  expenses!: Table<Expense, number>;
  ledger!: Table<LedgerEntry, number>;
  driverPay!: Table<DriverPayment, number>;
  settings!: Table<Settings, number>;
  tripAdvances!: Table<TripAdvance, number>;
  tripCharges!: Table<TripCharge, number>;
  tripPayments!: Table<TripPayment, number>;

  constructor() {
    super("transport-ledger");
    this.version(1).stores({
      trucks: "++id, number, type",
      parties: "++id, name",
      drivers: "++id, name",
      trips: "++id, tripDate, truckId, partyId, driverId, status",
      expenses: "++id, date, category, truckId",
      ledger: "++id, date, partyId, type, refType, refId",
      driverPay: "++id, date, driverId, type",
      settings: "id",
    });
    this.version(2)
      .stores({
        // Add indexes used by v2 features
        expenses: "++id, date, category, scope, truckId, tripId",
        tripAdvances: "++id, tripId, date",
        tripCharges: "++id, tripId, date",
        tripPayments: "++id, tripId, date",
      })
      .upgrade(async (tx) => {
        // Backfill scope on existing expenses
        await tx
          .table("expenses")
          .toCollection()
          .modify((e: Expense) => {
            if (!e.scope) e.scope = e.truckId ? "truck" : "office";
          });
        // Migrate trip.advance (single number) into tripAdvances rows
        const trips = await tx.table("trips").toArray();
        for (const t of trips as Trip[]) {
          if (t.advance && t.advance > 0 && t.id) {
            await tx.table("tripAdvances").add({
              tripId: t.id,
              date: t.tripDate,
              amount: t.advance,
              notes: "Migrated from trip.advance",
            });
          }
        }
      });
  }
}

export const db = new TLDB();

export const DEFAULT_SETTINGS: Settings = { id: 1, businessName: "My Transport" };

export async function readSettings(): Promise<Settings> {
  const s = await db.settings.get(1);
  return s ?? DEFAULT_SETTINGS;
}

export async function ensureSettings(): Promise<void> {
  const s = await db.settings.get(1);
  if (!s) await db.settings.put(DEFAULT_SETTINGS);
}
