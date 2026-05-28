"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DriverForm from "@/components/forms/DriverForm";

function Inner() {
  const id = Number(useSearchParams().get("id"));
  return <DriverForm id={id || undefined} />;
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
