"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Party } from "@/db/schema";
import { toPaise, toRupees } from "@/lib/inr";
import { Button, Card, Field, Input, Select, Textarea, PageHeader } from "@/components/ui/primitives";

type FormVals = {
  name: string;
  gstin?: string;
  phone?: string;
  address?: string;
  openingBalance: string;
  openingType: "dr" | "cr";
};

export default function PartyForm({ id }: { id?: number }) {
  const router = useRouter();
  const existing = useLiveQuery(async () => (id ? await db.parties.get(id) : undefined), [id]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormVals>({ defaultValues: { openingType: "dr", openingBalance: "0" } });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        gstin: existing.gstin,
        phone: existing.phone,
        address: existing.address,
        openingType: existing.openingType,
        openingBalance: String(toRupees(existing.openingBalance)),
      });
    }
  }, [existing, reset]);

  const onSubmit = async (v: FormVals) => {
    const data: Party = {
      name: v.name.trim(),
      gstin: v.gstin?.trim().toUpperCase() || undefined,
      phone: v.phone?.trim() || undefined,
      address: v.address?.trim() || undefined,
      openingBalance: toPaise(v.openingBalance || "0"),
      openingType: v.openingType,
    };
    if (id) await db.parties.update(id, data);
    else await db.parties.add(data);
    router.push("/parties");
  };

  return (
    <div className="space-y-3">
      <PageHeader title={id ? "Edit Party" : "Add Party"} />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <Field label="Party Name" error={errors.name?.message}>
            <Input {...register("name", { required: "Required" })} />
          </Field>
          <Field label="GSTIN">
            <Input placeholder="27ABCDE1234F1Z5" {...register("gstin")} />
          </Field>
          <Field label="Phone">
            <Input type="tel" {...register("phone")} />
          </Field>
          <Field label="Address">
            <Textarea rows={2} {...register("address")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opening Balance (₹)">
              <Input type="number" step="0.01" {...register("openingBalance")} />
            </Field>
            <Field label="Type">
              <Select {...register("openingType")}>
                <option value="dr">Dr (they owe us)</option>
                <option value="cr">Cr (we owe them)</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isSubmitting}>{id ? "Save" : "Add Party"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
