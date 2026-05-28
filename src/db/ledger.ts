import { db, type Trip } from "./schema";

// Auto ledger Dr entry for a trip = freight + GST.
export async function syncTripLedger(trip: Trip) {
  if (!trip.id) return;
  // Remove existing ledger rows for this trip
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
  await db.trips.delete(tripId);
}

export async function partyBalance(partyId: number): Promise<number> {
  const party = await db.parties.get(partyId);
  if (!party) return 0;
  const rows = await db.ledger.where({ partyId }).toArray();
  const opening = party.openingType === "dr" ? party.openingBalance : -party.openingBalance;
  const sum = rows.reduce((acc, r) => acc + (r.type === "dr" ? r.amount : -r.amount), 0);
  return opening + sum; // positive = party owes us
}
