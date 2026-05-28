"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Trip, type TripStatus } from "@/db/schema";
import { syncTripLedger, deleteTripCascade } from "@/db/ledger";
import { fmtINR, toPaise, toRupees } from "@/lib/inr";
import { Button, Card, Field, Input, Select, Textarea, PageHeader } from "@/components/ui/primitives";

type FormVals = {
  tripDate: string;
  lrNo?: string;
  truckId: string;
  partyId: string;
  driverId?: string;
  fromCity: string;
  toCity: string;
  freightAmount: string;
  gstPercent: string;
  advance: string;
  status: TripStatus;
  notes?: string;
};

export default function TripForm({ id }: { id?: number }) {
  const router = useRouter();
  const existing = useLiveQuery(async () => (id ? await db.trips.get(id) : undefined), [id]);
  const trucks = useLiveQuery(() => db.trucks.orderBy("number").toArray(), []);
  const parties = useLiveQuery(() => db.parties.orderBy("name").toArray(), []);
  const drivers = useLiveQuery(() => db.drivers.orderBy("name").toArray(), []);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormVals>({
      defaultValues: {
        tripDate: new Date().toISOString().slice(0, 10),
        gstPercent: "0",
        advance: "0",
        freightAmount: "",
        status: "open",
      },
    });

  useEffect(() => {
    if (existing) {
      reset({
        tripDate: existing.tripDate,
        lrNo: existing.lrNo,
        truckId: String(existing.truckId),
        partyId: String(existing.partyId),
        driverId: existing.driverId ? String(existing.driverId) : "",
        fromCity: existing.fromCity,
        toCity: existing.toCity,
        freightAmount: String(toRupees(existing.freightAmount)),
        gstPercent: String(existing.gstPercent),
        advance: String(toRupees(existing.advance)),
        status: existing.status,
        notes: existing.notes,
      });
    }
  }, [existing, reset]);

  const w = useWatch({ control });
  const totalPreview = useMemo(() => {
    const f = toPaise(w.freightAmount || "0");
    const gst = Math.round((f * Number(w.gstPercent || "0")) / 100);
    return { f, gst, total: f + gst };
  }, [w.freightAmount, w.gstPercent]);

  const onSubmit = async (v: FormVals) => {
    const data: Trip = {
      tripDate: v.tripDate,
      lrNo: v.lrNo?.trim() || undefined,
      truckId: Number(v.truckId),
      partyId: Number(v.partyId),
      driverId: v.driverId ? Number(v.driverId) : undefined,
      fromCity: v.fromCity.trim(),
      toCity: v.toCity.trim(),
      freightAmount: toPaise(v.freightAmount),
      gstPercent: Number(v.gstPercent || "0"),
      advance: toPaise(v.advance || "0"),
      status: v.status,
      notes: v.notes?.trim() || undefined,
    };
    let tripId = id;
    if (tripId) {
      await db.trips.update(tripId, data);
    } else {
      tripId = await db.trips.add(data);
    }
    await syncTripLedger({ ...data, id: tripId });
    router.push("/trips");
  };

  const onDelete = async () => {
    if (!id || !confirm("Delete this trip? Ledger entry will also be removed.")) return;
    await deleteTripCascade(id);
    router.push("/trips");
  };

  if (trucks && trucks.length === 0) {
    return (
      <div className="space-y-3">
        <PageHeader title="New Trip" />
        <Card>
          <p className="text-sm text-slate-600">Add at least one truck before creating a trip.</p>
          <Button className="mt-3" onClick={() => router.push("/trucks/new")}>Add Truck</Button>
        </Card>
      </div>
    );
  }
  if (parties && parties.length === 0) {
    return (
      <div className="space-y-3">
        <PageHeader title="New Trip" />
        <Card>
          <p className="text-sm text-slate-600">Add at least one party before creating a trip.</p>
          <Button className="mt-3" onClick={() => router.push("/parties/new")}>Add Party</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader title={id ? "Edit Trip" : "New Trip"} />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trip Date"><Input type="date" {...register("tripDate", { required: true })} /></Field>
            <Field label="LR No"><Input {...register("lrNo")} /></Field>
          </div>
          <Field label="Truck" error={errors.truckId?.message}>
            <Select {...register("truckId", { required: "Required" })}>
              <option value="">— Select truck —</option>
              {trucks?.map((t) => <option key={t.id} value={t.id}>{t.number} ({t.type})</option>)}
            </Select>
          </Field>
          <Field label="Party" error={errors.partyId?.message}>
            <Select {...register("partyId", { required: "Required" })}>
              <option value="">— Select party —</option>
              {parties?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Driver (optional)">
            <Select {...register("driverId")}>
              <option value="">— None —</option>
              {drivers?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From"><Input {...register("fromCity", { required: true })} /></Field>
            <Field label="To"><Input {...register("toCity", { required: true })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Freight (₹)" error={errors.freightAmount?.message}>
              <Input type="number" step="0.01" {...register("freightAmount", { required: "Required" })} />
            </Field>
            <Field label="GST %">
              <Input type="number" step="0.01" {...register("gstPercent")} />
            </Field>
            <Field label="Advance (₹)">
              <Input type="number" step="0.01" {...register("advance")} />
            </Field>
          </div>
          <Field label="Status">
            <Select {...register("status")}>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="settled">Settled</option>
            </Select>
          </Field>
          <Field label="Notes"><Textarea rows={2} {...register("notes")} /></Field>

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between"><span>Freight</span><span>{fmtINR(totalPreview.f)}</span></div>
            <div className="flex justify-between"><span>GST</span><span>{fmtINR(totalPreview.gst)}</span></div>
            <div className="flex justify-between font-semibold border-t border-slate-200 pt-1 mt-1">
              <span>Party will be billed</span><span>{fmtINR(totalPreview.total)}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isSubmitting}>{id ? "Save" : "Create Trip"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            {id && <Button type="button" variant="danger" className="ml-auto" onClick={onDelete}>Delete</Button>}
          </div>
        </form>
      </Card>
    </div>
  );
}
