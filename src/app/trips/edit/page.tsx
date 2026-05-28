"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TripForm from "@/components/forms/TripForm";

function Inner() {
  const id = Number(useSearchParams().get("id"));
  return <TripForm id={id || undefined} />;
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
