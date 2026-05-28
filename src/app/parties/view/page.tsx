"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PartyDetail from "@/components/PartyDetail";

function Inner() {
  const id = Number(useSearchParams().get("id"));
  if (!id) return <p className="text-slate-500">Missing party id.</p>;
  return <PartyDetail id={id} />;
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
