"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Expense, type ExpenseCategory, type ExpenseScope } from "@/db/schema";
import { toPaise, toRupees, fmtINR } from "@/lib/inr";
import { Button, Card, Field, Input, Select, Textarea, PageHeader, Chip } from "@/components/ui/primitives";

type FormVals = {
  date: string;
  scope: ExpenseScope;
  category: ExpenseCategory;
  truckId?: string;
  tripId?: string;
  amount: string;
  paidTo?: string;
  paymentMode?: string;
  notes?: string;
  fuelQuantity?: string;
  fuelRatePerLitre?: string;
  kmReading?: string;
  fullTank?: boolean;
};

const CATEGORIES_BY_SCOPE: Record<ExpenseScope, ExpenseCategory[]> = {
  truck: ["fuel", "maintenance", "repair", "emi", "misc"],
  trip: ["fuel", "toll", "misc"],
  office: ["office", "misc"],
};

export default function ExpenseForm({ id }: { id?: number }) {
  const router = useRouter();
  const existing = useLiveQuery(async () => (id ? await db.expenses.get(id) : undefined), [id]);
  const trucks = useLiveQuery(() => db.trucks.orderBy("number").toArray(), []);
  const trips = useLiveQuery(() => db.trips.orderBy("tripDate").reverse().toArray(), []);

  const {
    register, handleSubmit, reset, control, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormVals>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      scope: "truck",
      category: "fuel",
      amount: "",
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        date: existing.date,
        scope: existing.scope,
        category: existing.category,
        truckId: existing.truckId ? String(existing.truckId) : "",
        tripId: existing.tripId ? String(existing.tripId) : "",
        amount: String(toRupees(existing.amount)),
        paidTo: existing.paidTo,
        paymentMode: existing.paymentMode,
        notes: existing.notes,
        fuelQuantity: existing.fuelQuantity?.toString(),
        fuelRatePerLitre: existing.fuelRatePerLitre ? String(toRupees(existing.fuelRatePerLitre)) : undefined,
        kmReading: existing.kmReading?.toString(),
        fullTank: existing.fullTank,
      });
    }
  }, [existing, reset]);

  const w = useWatch({ control });
  const scope = w.scope ?? "truck";
  const category = w.category ?? "fuel";
  const needsTruck = scope === "truck" || scope === "trip";
  const isFuel = category === "fuel" && (scope === "truck" || scope === "trip");

  // Keep category valid when scope changes
  useEffect(() => {
    const allowed = CATEGORIES_BY_SCOPE[scope];
    if (!allowed.includes(category as ExpenseCategory)) {
      setValue("category", allowed[0]);
    }
  }, [scope, category, setValue]);

  // Fuel auto-calc: amount = qty × rate. Fill the missing one if 2 of 3 are present.
  const fuelCalc = useMemo(() => {
    if (!isFuel) return null;
    const qty = parseFloat(w.fuelQuantity ?? "");
    const rate = parseFloat(w.fuelRatePerLitre ?? "");
    const amt = parseFloat(w.amount ?? "");
    const hasQty = isFinite(qty) && qty > 0;
    const hasRate = isFinite(rate) && rate > 0;
    const hasAmt = isFinite(amt) && amt > 0;
    if (hasQty && hasRate && !hasAmt) return { amount: +(qty * rate).toFixed(2) };
    if (hasAmt && hasQty && !hasRate) return { rate: +(amt / qty).toFixed(4) };
    if (hasAmt && hasRate && !hasQty) return { qty: +(amt / rate).toFixed(3) };
    return null;
  }, [w.fuelQuantity, w.fuelRatePerLitre, w.amount, isFuel]);

  useEffect(() => {
    if (!fuelCalc) return;
    if ("amount" in fuelCalc) setValue("amount", String(fuelCalc.amount));
    else if ("rate" in fuelCalc) setValue("fuelRatePerLitre", String(fuelCalc.rate));
    else if ("qty" in fuelCalc) setValue("fuelQuantity", String(fuelCalc.qty));
  }, [fuelCalc, setValue]);

  const onSubmit = async (v: FormVals) => {
    if (needsTruck && !v.truckId) {
      alert("Truck is required for truck/trip expenses.");
      return;
    }
    if (v.scope === "trip" && !v.tripId) {
      alert("Trip is required for trip expenses.");
      return;
    }
    const data: Expense = {
      date: v.date,
      scope: v.scope,
      category: v.category,
      truckId: v.truckId ? Number(v.truckId) : undefined,
      tripId: v.tripId ? Number(v.tripId) : undefined,
      amount: toPaise(v.amount),
      paidTo: v.paidTo?.trim() || undefined,
      paymentMode: v.paymentMode?.trim() || undefined,
      notes: v.notes?.trim() || undefined,
      fuelQuantity: v.fuelQuantity ? parseFloat(v.fuelQuantity) : undefined,
      fuelRatePerLitre: v.fuelRatePerLitre ? toPaise(v.fuelRatePerLitre) : undefined,
      kmReading: v.kmReading ? parseFloat(v.kmReading) : undefined,
      fullTank: v.fullTank || undefined,
    };
    if (id) await db.expenses.update(id, data);
    else await db.expenses.add(data);
    router.push("/expenses/");
  };

  const onDelete = async () => {
    if (!id || !confirm("Delete this expense?")) return;
    await db.expenses.delete(id);
    router.push("/expenses/");
  };

  const scopeChoices: { value: ExpenseScope; label: string }[] = [
    { value: "trip", label: "Trip Expense" },
    { value: "truck", label: "Truck Expense" },
    { value: "office", label: "Office Expense" },
  ];

  return (
    <div className="space-y-3">
      <PageHeader title={id ? "Edit Expense" : "Add Expense"} />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          {/* Scope chips */}
          <Field label="Expense Type">
            <div className="flex gap-2">
              {scopeChoices.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setValue("scope", s.value)}
                  className={`md-pressable flex-1 rounded-2xl px-3 py-3 text-[13px] font-semibold transition-colors ${
                    scope === s.value
                      ? "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] ring-2 ring-[var(--md-primary)]/30"
                      : "bg-[var(--md-surface-container-low)] text-[var(--md-on-surface-variant)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register("scope")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input type="date" {...register("date", { required: true })} />
            </Field>
            <Field label="Category">
              <Select {...register("category")}>
                {CATEGORIES_BY_SCOPE[scope].map((c) => (
                  <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                ))}
              </Select>
            </Field>
          </div>

          {needsTruck && (
            <Field label="Truck (required)" error={errors.truckId?.message}>
              <Select {...register("truckId", { required: needsTruck ? "Truck is required" : false })}>
                <option value="">— Select truck —</option>
                {trucks?.map((t) => <option key={t.id} value={t.id}>{t.number}</option>)}
              </Select>
            </Field>
          )}

          {scope === "trip" && (
            <Field label="Trip (required)">
              <Select {...register("tripId", { required: scope === "trip" ? "Trip is required" : false })}>
                <option value="">— Select trip —</option>
                {trips?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tripDate} · {t.fromCity}→{t.toCity}{t.lrNo ? ` · LR ${t.lrNo}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Amount (₹)" error={errors.amount?.message} hint={isFuel ? "Auto-fills from Qty × Rate when both present" : undefined}>
            <Input type="number" step="0.01" {...register("amount", { required: "Required" })} />
          </Field>

          {/* Fuel-specific fields */}
          {isFuel && (
            <Card tone="low" className="!p-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--md-on-surface-variant)]">
                Fuel details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fuel Quantity (L)">
                  <Input type="number" step="0.01" placeholder="Litres" {...register("fuelQuantity")} />
                </Field>
                <Field label="Rate per Litre (₹)">
                  <Input type="number" step="0.01" placeholder="₹ / L" {...register("fuelRatePerLitre")} />
                </Field>
              </div>
              <p className="mb-2 text-[12px] text-[var(--md-on-surface-variant)]">
                Fill any two — the third auto-fills.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="KM Reading (optional)">
                  <Input type="number" step="0.1" {...register("kmReading")} />
                </Field>
                <Field label="Full tank?">
                  <label className="flex h-14 items-center gap-3 rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] px-4">
                    <input type="checkbox" {...register("fullTank")} className="h-5 w-5" />
                    <span className="text-[13px] text-[var(--md-on-surface-variant)]">
                      I filled the full tank
                    </span>
                  </label>
                </Field>
              </div>
              {(w.fuelQuantity || w.fuelRatePerLitre) && (
                <p className="mt-2 text-[12px] text-[var(--md-on-surface-variant)]">
                  Computed: {w.fuelQuantity || "—"} L × {w.fuelRatePerLitre ? `₹${w.fuelRatePerLitre}/L` : "—"} = <strong>{w.amount ? fmtINR(toPaise(w.amount)) : "—"}</strong>
                </p>
              )}
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={isFuel ? "Pump Name" : "Paid To"}>
              <Input {...register("paidTo")} />
            </Field>
            <Field label="Payment Mode">
              <Select {...register("paymentMode")}>
                <option value="">—</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
                <option value="paid-by-driver">Paid by driver</option>
              </Select>
            </Field>
          </div>

          <Field label="Notes">
            <Textarea rows={2} {...register("notes")} />
          </Field>

          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isSubmitting}>{id ? "Save" : "Add Expense"}</Button>
            <Button type="button" variant="outlined" onClick={() => router.back()}>Cancel</Button>
            {id && (
              <Button type="button" variant="danger" className="ml-auto" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
