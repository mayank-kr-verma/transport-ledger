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
  openingBalance: number; // paise (positive = we owe driver)
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
  advance: number; // paise (advance paid to driver / deducted from freight)
  status: TripStatus;
  notes?: string;
}

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
  category: ExpenseCategory;
  truckId?: number;
  amount: number; // paise
  paidTo?: string;
  paymentMode?: string;
  notes?: string;
}

export type LedgerRefType = "trip" | "payment" | "advance" | "adjustment" | "opening";
export interface LedgerEntry {
  id?: number;
  date: string;
  partyId: number;
  type: DrCr;
  amount: number; // paise
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
  amount: number; // paise
  notes?: string;
}

export interface Settings {
  id: number; // always 1
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
  }
}

export const db = new TLDB();

export const DEFAULT_SETTINGS: Settings = { id: 1, businessName: "My Transport" };

// Read-only — safe inside useLiveQuery.
export async function readSettings(): Promise<Settings> {
  const s = await db.settings.get(1);
  return s ?? DEFAULT_SETTINGS;
}

// Write — call outside liveQuery (e.g. in useEffect).
export async function ensureSettings(): Promise<void> {
  const s = await db.settings.get(1);
  if (!s) await db.settings.put(DEFAULT_SETTINGS);
}
