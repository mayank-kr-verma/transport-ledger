"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TruckForm from "@/components/forms/TruckForm";

function Inner() {
  const id = Number(useSearchParams().get("id"));
  return <TruckForm id={id || undefined} />;
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
