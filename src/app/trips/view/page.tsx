"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TripDetail from "@/components/TripDetail";

function Inner() {
  const id = Number(useSearchParams().get("id"));
  if (!id) return <p className="text-[var(--md-on-surface-variant)]">Missing trip id.</p>;
  return <TripDetail id={id} />;
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
