"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ExpenseForm from "@/components/forms/ExpenseForm";

function Inner() {
  const id = Number(useSearchParams().get("id"));
  return <ExpenseForm id={id || undefined} />;
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
