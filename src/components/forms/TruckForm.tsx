"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Truck } from "@/db/schema";
import { Button, Card, Field, Input, Select, Textarea, PageHeader } from "@/components/ui/primitives";

type FormVals = {
  number: string;
  type: "owned" | "market";
  ownerName?: string;
  registrationDate?: string;
  notes?: string;
};

export default function TruckForm({ id }: { id?: number }) {
  const router = useRouter();
  const existing = useLiveQuery(async () => (id ? await db.trucks.get(id) : undefined), [id]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormVals>({ defaultValues: { type: "owned" } });

  useEffect(() => {
    if (existing) reset(existing as FormVals);
  }, [existing, reset]);

  const onSubmit = async (v: FormVals) => {
    const data: Truck = {
      number: v.number.trim().toUpperCase(),
      type: v.type,
      ownerName: v.ownerName?.trim() || undefined,
      registrationDate: v.registrationDate || undefined,
      notes: v.notes?.trim() || undefined,
    };
    if (id) await db.trucks.update(id, data);
    else await db.trucks.add(data);
    router.push("/trucks");
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm("Delete this truck? Trips referencing it will keep the id.")) return;
    await db.trucks.delete(id);
    router.push("/trucks");
  };

  return (
    <div className="space-y-3">
      <PageHeader title={id ? "Edit Truck" : "Add Truck"} />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <Field label="Truck Number" error={errors.number?.message}>
            <Input placeholder="MH04 AB 1234" {...register("number", { required: "Required" })} />
          </Field>
          <Field label="Type">
            <Select {...register("type")}>
              <option value="owned">Owned</option>
              <option value="market">Market / Rented</option>
            </Select>
          </Field>
          <Field label="Owner Name (for market trucks)">
            <Input {...register("ownerName")} />
          </Field>
          <Field label="Registration Date">
            <Input type="date" {...register("registrationDate")} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} {...register("notes")} />
          </Field>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isSubmitting}>{id ? "Save" : "Add Truck"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
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
