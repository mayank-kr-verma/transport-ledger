"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Expense, type ExpenseCategory } from "@/db/schema";
import { toPaise, toRupees } from "@/lib/inr";
import { Button, Card, Field, Input, Select, Textarea, PageHeader } from "@/components/ui/primitives";

type FormVals = {
  date: string;
  category: ExpenseCategory;
  truckId?: string;
  amount: string;
  paidTo?: string;
  paymentMode?: string;
  notes?: string;
};

export default function ExpenseForm({ id }: { id?: number }) {
  const router = useRouter();
  const existing = useLiveQuery(async () => (id ? await db.expenses.get(id) : undefined), [id]);
  const trucks = useLiveQuery(() => db.trucks.orderBy("number").toArray(), []);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormVals>({
      defaultValues: { date: new Date().toISOString().slice(0, 10), category: "fuel", amount: "" },
    });

  useEffect(() => {
    if (existing) {
      reset({
        date: existing.date,
        category: existing.category,
        truckId: existing.truckId ? String(existing.truckId) : "",
        amount: String(toRupees(existing.amount)),
        paidTo: existing.paidTo,
        paymentMode: existing.paymentMode,
        notes: existing.notes,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (v: FormVals) => {
    const data: Expense = {
      date: v.date,
      category: v.category,
      truckId: v.truckId ? Number(v.truckId) : undefined,
      amount: toPaise(v.amount),
      paidTo: v.paidTo?.trim() || undefined,
      paymentMode: v.paymentMode?.trim() || undefined,
      notes: v.notes?.trim() || undefined,
    };
    if (id) await db.expenses.update(id, data);
    else await db.expenses.add(data);
    router.push("/expenses");
  };

  const onDelete = async () => {
    if (!id || !confirm("Delete this expense?")) return;
    await db.expenses.delete(id);
    router.push("/expenses");
  };

  return (
    <div className="space-y-3">
      <PageHeader title={id ? "Edit Expense" : "Add Expense"} />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><Input type="date" {...register("date", { required: true })} /></Field>
            <Field label="Amount (₹)" error={errors.amount?.message}>
              <Input type="number" step="0.01" {...register("amount", { required: "Required" })} />
            </Field>
          </div>
          <Field label="Category">
            <Select {...register("category")}>
              <option value="office">Office</option>
              <option value="maintenance">Truck Maintenance</option>
              <option value="fuel">Fuel</option>
              <option value="toll">Toll</option>
              <option value="emi">EMI</option>
              <option value="repair">Repair</option>
              <option value="misc">Miscellaneous</option>
            </Select>
          </Field>
          <Field label="Truck (optional)">
            <Select {...register("truckId")}>
              <option value="">— None —</option>
              {trucks?.map((t) => <option key={t.id} value={t.id}>{t.number}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Paid To"><Input {...register("paidTo")} /></Field>
            <Field label="Payment Mode">
              <Select {...register("paymentMode")}>
                <option value="">—</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes"><Textarea rows={2} {...register("notes")} /></Field>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isSubmitting}>{id ? "Save" : "Add Expense"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            {id && <Button type="button" variant="danger" className="ml-auto" onClick={onDelete}>Delete</Button>}
          </div>
        </form>
      </Card>
    </div>
  );
}
