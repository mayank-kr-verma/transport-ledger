"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Truck } from "@/db/schema";
import { truckHasAnyTrip } from "@/db/ledger";
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
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
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
    router.push("/trucks/");
  };

  const onDelete = async () => {
    if (!id) return;
    if (await truckHasAnyTrip(id)) {
      alert("Cannot delete: this truck has trips recorded against it. Delete or reassign those trips first.");
      return;
    }
    if (!confirm("Delete this truck?")) return;
    await db.trucks.delete(id);
    router.push("/trucks/");
  };

  return (
    <div className="space-y-3">
      <PageHeader title={id ? "Edit Truck" : "Add Truck"} />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <Field label="Truck Number" error={errors.number?.message} hint="UPPERCASE, max 10 characters">
            <Input
              placeholder="MH04AB1234"
              maxLength={10}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="uppercase tracking-wider"
              {...register("number", {
                required: "Required",
                maxLength: { value: 10, message: "Max 10 characters" },
                onChange: (e) => setValue("number", e.target.value.toUpperCase().slice(0, 10)),
              })}
            />
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
