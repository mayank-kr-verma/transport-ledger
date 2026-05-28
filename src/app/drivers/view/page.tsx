"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DriverDetail from "@/components/DriverDetail";

function Inner() {
  const id = Number(useSearchParams().get("id"));
  if (!id) return <p className="text-slate-500">Missing driver id.</p>;
  return <DriverDetail id={id} />;
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
