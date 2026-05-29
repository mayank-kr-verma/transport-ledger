import { db, type Trip } from "./schema";

// Auto ledger Dr entry for a trip = freight + GST.
export async function syncTripLedger(trip: Trip) {
  if (!trip.id) return;
  await db.ledger.where({ refType: "trip", refId: trip.id }).delete();
  const gst = Math.round((trip.freightAmount * trip.gstPercent) / 100);
  const total = trip.freightAmount + gst;
  await db.ledger.add({
    date: trip.tripDate,
    partyId: trip.partyId,
    type: "dr",
    amount: total,
    refType: "trip",
    refId: trip.id,
    notes: `Trip ${trip.fromCity} → ${trip.toCity}${trip.lrNo ? ` LR ${trip.lrNo}` : ""}`,
  });
}

export async function deleteTripCascade(tripId: number) {
  await db.ledger.where({ refType: "trip", refId: tripId }).delete();
  await db.ledger.where({ refType: "charge", refId: tripId }).delete();
  await db.ledger.where({ refType: "payment", refId: tripId }).delete();
  await db.ledger.where({ refType: "advance", refId: tripId }).delete();
  await db.tripAdvances.where({ tripId }).delete();
  await db.tripCharges.where({ tripId }).delete();
  await db.tripPayments.where({ tripId }).delete();
  await db.trips.delete(tripId);
}

export async function partyBalance(partyId: number): Promise<number> {
  const party = await db.parties.get(partyId);
  if (!party) return 0;
  const rows = await db.ledger.where({ partyId }).toArray();
  const opening = party.openingType === "dr" ? party.openingBalance : -party.openingBalance;
  const sum = rows.reduce((acc, r) => acc + (r.type === "dr" ? r.amount : -r.amount), 0);
  return opening + sum;
}

/* Trip sub-entity helpers: each creates/removes the corresponding ledger entry too. */
export async function addTripAdvance(opts: { tripId: number; date: string; amount: number; paidTo?: string; notes?: string }) {
  const trip = await db.trips.get(opts.tripId);
  if (!trip) throw new Error("Trip not found");
  const advId = await db.tripAdvances.add({
    tripId: opts.tripId, date: opts.date, amount: opts.amount, paidTo: opts.paidTo, notes: opts.notes,
  });
  await db.ledger.add({
    date: opts.date, partyId: trip.partyId, type: "cr", amount: opts.amount,
    refType: "advance", refId: advId, notes: opts.notes || `Trip advance${opts.paidTo ? ` to ${opts.paidTo}` : ""}`,
  });
  return advId;
}

export async function deleteTripAdvance(id: number) {
  await db.ledger.where({ refType: "advance", refId: id }).delete();
  await db.tripAdvances.delete(id);
}

export async function addTripCharge(opts: { tripId: number; date: string; amount: number; label: string; notes?: string }) {
  const trip = await db.trips.get(opts.tripId);
  if (!trip) throw new Error("Trip not found");
  const chId = await db.tripCharges.add({
    tripId: opts.tripId, date: opts.date, amount: opts.amount, label: opts.label, notes: opts.notes,
  });
  await db.ledger.add({
    date: opts.date, partyId: trip.partyId, type: "dr", amount: opts.amount,
    refType: "charge", refId: chId, notes: opts.label || "Trip charge",
  });
  return chId;
}

export async function deleteTripCharge(id: number) {
  await db.ledger.where({ refType: "charge", refId: id }).delete();
  await db.tripCharges.delete(id);
}

export async function addTripPayment(opts: { tripId: number; date: string; amount: number; mode?: string; notes?: string }) {
  const trip = await db.trips.get(opts.tripId);
  if (!trip) throw new Error("Trip not found");
  const payId = await db.tripPayments.add({
    tripId: opts.tripId, date: opts.date, amount: opts.amount, mode: opts.mode, notes: opts.notes,
  });
  await db.ledger.add({
    date: opts.date, partyId: trip.partyId, type: "cr", amount: opts.amount,
    refType: "payment", refId: payId, notes: opts.notes || `Trip payment${opts.mode ? ` (${opts.mode})` : ""}`,
  });
  return payId;
}

export async function deleteTripPayment(id: number) {
  await db.ledger.where({ refType: "payment", refId: id }).delete();
  await db.tripPayments.delete(id);
}

/* Pending balance for a single trip = freight + gst + charges − advances − payments */
export async function tripPendingBalance(tripId: number): Promise<{
  freight: number; gst: number; charges: number; advances: number; payments: number; pending: number;
}> {
  const trip = await db.trips.get(tripId);
  if (!trip) return { freight: 0, gst: 0, charges: 0, advances: 0, payments: 0, pending: 0 };
  const gst = Math.round((trip.freightAmount * trip.gstPercent) / 100);
  const [advRows, chRows, payRows] = await Promise.all([
    db.tripAdvances.where({ tripId }).toArray(),
    db.tripCharges.where({ tripId }).toArray(),
    db.tripPayments.where({ tripId }).toArray(),
  ]);
  const advances = advRows.reduce((a, r) => a + r.amount, 0);
  const charges = chRows.reduce((a, r) => a + r.amount, 0);
  const payments = payRows.reduce((a, r) => a + r.amount, 0);
  const pending = trip.freightAmount + gst + charges - advances - payments;
  return { freight: trip.freightAmount, gst, charges, advances, payments, pending };
}

/* Is truck currently on a trip? (any open or completed-but-unsettled trip) */
export async function isTruckOnTrip(truckId: number): Promise<boolean> {
  const t = await db.trips
    .where("truckId")
    .equals(truckId)
    .filter((tr) => tr.status === "open" || tr.status === "completed")
    .first();
  return !!t;
}

export async function truckHasAnyTrip(truckId: number): Promise<boolean> {
  return (await db.trips.where("truckId").equals(truckId).count()) > 0;
}

export async function partyHasAnyTrip(partyId: number): Promise<boolean> {
  return (await db.trips.where("partyId").equals(partyId).count()) > 0;
}
