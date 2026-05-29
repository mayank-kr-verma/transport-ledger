"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { Chip, EmptyState, Fab, Input, ListItem, PageHeader } from "@/components/ui/primitives";
import { Plus, Truck as TruckIcon, Search } from "lucide-react";

type Tab = "all" | "available" | "ontrip";

function lastFour(n: string) {
  const m = n.match(/(\d+)$/);
  if (!m) return { head: n, tail: "" };
  const tail = m[1].slice(-4);
  const head = n.slice(0, n.length - tail.length);
  return { head, tail };
}

export default function TrucksPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const trucks = useLiveQuery(() => db.trucks.orderBy("number").toArray(), []);
  const trips = useLiveQuery(() => db.trips.toArray(), []);

  const onTripIds = useMemo(() => {
    const ids = new Set<number>();
    (trips ?? []).forEach((t) => {
      if (t.status === "open" || t.status === "completed") ids.add(t.truckId);
    });
    return ids;
  }, [trips]);

  // Last route per truck (for label)
  const lastRouteByTruck = useMemo(() => {
    const map = new Map<number, { from: string; to: string }>();
    const sorted = (trips ?? []).slice().sort((a, b) => (a.tripDate < b.tripDate ? 1 : -1));
    for (const t of sorted) {
      if (!map.has(t.truckId)) map.set(t.truckId, { from: t.fromCity, to: t.toCity });
    }
    return map;
  }, [trips]);

  const counts = useMemo(() => {
    const total = trucks?.length ?? 0;
    const on = (trucks ?? []).filter((t) => onTripIds.has(t.id!)).length;
    return { all: total, ontrip: on, available: total - on };
  }, [trucks, onTripIds]);

  const filtered = useMemo(() => {
    let rows = trucks ?? [];
    if (tab === "available") rows = rows.filter((t) => !onTripIds.has(t.id!));
    if (tab === "ontrip") rows = rows.filter((t) => onTripIds.has(t.id!));
    if (q.trim()) {
      const needle = q.trim().toUpperCase();
      rows = rows.filter((t) => t.number.toUpperCase().includes(needle));
    }
    return rows;
  }, [trucks, tab, q, onTripIds]);

  return (
    <div>
      <PageHeader title="Trucks" subtitle={trucks ? `${trucks.length} total` : undefined} />

      {/* Tab chips */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <TabChip active={tab === "all"} onClick={() => setTab("all")} label="All" count={counts.all} />
        <TabChip active={tab === "available"} onClick={() => setTab("available")} label="Available" count={counts.available} tone="success" />
        <TabChip active={tab === "ontrip"} onClick={() => setTab("ontrip")} label="On Trip" count={counts.ontrip} tone="warning" />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
        <Input
          placeholder="Search by truck number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-11"
        />
      </div>

      {filtered.length === 0 && (
        <EmptyState message={q || tab !== "all" ? "No trucks match this filter." : "No trucks yet. Tap + to add one."} />
      )}

      <div className="space-y-2">
        {filtered.map((t, i) => {
          const onTrip = onTripIds.has(t.id!);
          const { head, tail } = lastFour(t.number);
          const route = lastRouteByTruck.get(t.id!);
          return (
            <div key={t.id} className={`md-rise md-rise-${Math.min(i + 1, 6)}`}>
              <ListItem
                leading={<TruckIcon size={20} />}
                title={
                  <span>
                    {head}
                    <span className="text-[var(--md-primary)]">{tail}</span>
                  </span>
                }
                supporting={
                  <span className="flex items-center gap-2">
                    <Chip tone={t.type === "owned" ? "primary" : "warning"} className="!py-0.5 !text-[10px]">
                      {t.type === "owned" ? "Owned" : "Market"}
                    </Chip>
                    {route && <span className="text-[12px]">{route.from} → {route.to}</span>}
                  </span>
                }
                onClick={() => router.push(`/trucks/edit/?id=${t.id}`)}
                trailing={
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${onTrip ? "bg-[var(--md-primary)]" : "bg-[var(--md-tertiary)]"}`} />
                    <span className="text-[12px] font-semibold text-[var(--md-on-surface-variant)]">
                      {onTrip ? "On Trip" : "Available"}
                    </span>
                  </span>
                }
              />
            </div>
          );
        })}
      </div>

      <Fab extended icon={<Plus size={20} />} onClick={() => (window.location.href = "/trucks/new/")}>
        Add truck
      </Fab>
    </div>
  );
}

function TabChip({
  active,
  onClick,
  label,
  count,
  tone = "primary",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "primary" | "success" | "warning";
}) {
  const activeBg: Record<string, string> = {
    primary: "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]",
    success: "bg-[var(--md-success-container)] text-[var(--md-on-success-container)]",
    warning: "bg-[#ffe3a8] text-[#3b2700]",
  };
  return (
    <button
      onClick={onClick}
      className={`md-pressable rounded-2xl px-3 py-3 text-left transition-colors ${
        active
          ? activeBg[tone] + " ring-2 ring-[var(--md-primary)]/30"
          : "bg-[var(--md-surface-container-low)] text-[var(--md-on-surface-variant)]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] opacity-80">{label}</p>
      <p className="mt-0.5 font-display text-[22px] font-semibold leading-none">{count}</p>
    </button>
  );
}
