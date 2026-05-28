"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PartyForm from "@/components/forms/PartyForm";

function Inner() {
  const id = Number(useSearchParams().get("id"));
  return <PartyForm id={id || undefined} />;
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
