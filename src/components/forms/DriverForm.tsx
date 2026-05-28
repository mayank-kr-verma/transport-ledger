"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Driver } from "@/db/schema";
import { toPaise, toRupees } from "@/lib/inr";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui/primitives";

type FormVals = {
  name: string;
  phone?: string;
  licenseNo?: string;
  joiningDate?: string;
  openingBalance: string;
};

export default function DriverForm({ id }: { id?: number }) {
  const router = useRouter();
  const existing = useLiveQuery(async () => (id ? await db.drivers.get(id) : undefined), [id]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormVals>({ defaultValues: { openingBalance: "0" } });

  useEffect(() => {
    if (existing) reset({ ...existing, openingBalance: String(toRupees(existing.openingBalance)) });
  }, [existing, reset]);

  const onSubmit = async (v: FormVals) => {
    const data: Driver = {
      name: v.name.trim(),
      phone: v.phone?.trim() || undefined,
      licenseNo: v.licenseNo?.trim() || undefined,
      joiningDate: v.joiningDate || undefined,
      openingBalance: toPaise(v.openingBalance || "0"),
    };
    if (id) await db.drivers.update(id, data);
    else await db.drivers.add(data);
    router.push("/drivers");
  };

  return (
    <div className="space-y-3">
      <PageHeader title={id ? "Edit Driver" : "Add Driver"} />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register("name", { required: "Required" })} />
          </Field>
          <Field label="Phone"><Input type="tel" {...register("phone")} /></Field>
          <Field label="License No"><Input {...register("licenseNo")} /></Field>
          <Field label="Joining Date"><Input type="date" {...register("joiningDate")} /></Field>
          <Field label="Opening Payable (₹, what we owe driver)">
            <Input type="number" step="0.01" {...register("openingBalance")} />
          </Field>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isSubmitting}>{id ? "Save" : "Add Driver"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
