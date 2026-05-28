"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { fmtINR } from "@/lib/inr";
import { plOverall } from "@/lib/pl";
import { Card, Fab } from "@/components/ui/primitives";
import { MoreLinks } from "@/components/BottomNav";
import { Route, Truck as TruckIcon, Users, Plus, TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const r = monthRange();
  const summary = useLiveQuery(() => plOverall(r), [r.from, r.to]);
  const trucks = useLiveQuery(() => db.trucks.count(), []);
  const trips = useLiveQuery(() => db.trips.count(), []);
  const parties = useLiveQuery(() => db.parties.count(), []);

  const monthLabel = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="relative">
      <div className="md-wallpaper" />

      <div className="relative z-10 space-y-6">
        {/* Hero */}
        <div className="md-rise md-rise-1">
          <p className="text-sm font-medium text-[var(--md-on-surface-variant)]">{greeting()}</p>
          <h1 className="font-display text-[34px] font-semibold leading-[1.05] tracking-tight">
            Here's your <span className="text-[var(--md-primary)]">{monthLabel.split(" ")[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--md-on-surface-variant)]">
            {summary?.tripCount ?? 0} trips · {trucks ?? 0} trucks · {parties ?? 0} parties
          </p>
        </div>

        {/* Profit hero card */}
        <Link href="/reports/pl" className="md-rise md-rise-2 block">
          <Card tone="primary" className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] opacity-70">
                  Profit this month
                </p>
                <p className="mt-2 font-display text-[44px] font-semibold leading-none tracking-tight">
                  {summary ? fmtINR(summary.profit) : "—"}
                </p>
                <p className="mt-3 text-sm opacity-80">
                  From {summary?.tripCount ?? 0} trips · tap for full report
                </p>
              </div>
              <div className="rounded-full bg-white/40 p-3">
                <BarChart3 size={22} />
              </div>
            </div>
          </Card>
        </Link>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            className="md-rise md-rise-3"
            label="Income"
            value={summary ? fmtINR(summary.income) : "—"}
            icon={<TrendingUp size={18} />}
            tone="tertiary"
          />
          <StatTile
            className="md-rise md-rise-4"
            label="Expenses"
            value={summary ? fmtINR(summary.expense) : "—"}
            icon={<TrendingDown size={18} />}
            tone="danger"
          />
          <StatTile
            className="md-rise md-rise-5"
            label="Driver pay"
            value={summary ? fmtINR(summary.driverPay) : "—"}
            icon={<Wallet size={18} />}
            tone="neutral"
            wide
          />
        </div>

        {/* Quick actions */}
        <div className="md-rise md-rise-6">
          <h2 className="mb-3 font-display text-lg font-semibold">Quick add</h2>
          <div className="grid grid-cols-3 gap-3">
            <QuickAction href="/trips/new" icon={<Route size={22} />} label="New trip" count={trips ?? 0} primary />
            <QuickAction href="/parties/new" icon={<Users size={22} />} label="Party" count={parties ?? 0} />
            <QuickAction href="/trucks/new" icon={<TruckIcon size={22} />} label="Truck" count={trucks ?? 0} />
          </div>
        </div>

        {/* More */}
        <div className="md-rise md-rise-6">
          <h2 className="mb-3 font-display text-lg font-semibold">More</h2>
          <MoreLinks />
        </div>
      </div>

      <Fab extended icon={<Plus size={20} />} onClick={() => (window.location.href = "/trips/new/")}>
        New trip
      </Fab>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
  wide,
  className,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "tertiary" | "danger" | "neutral";
  wide?: boolean;
  className?: string;
}) {
  const tones = {
    tertiary: {
      card: "bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)]",
      pill: "bg-[var(--md-tertiary)] text-white",
    },
    danger: {
      card: "bg-[var(--md-error-container)] text-[var(--md-on-error-container)]",
      pill: "bg-[var(--md-error)] text-white",
    },
    neutral: {
      card: "bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]",
      pill: "bg-[var(--md-secondary)] text-white",
    },
  } as const;
  return (
    <div
      className={`${tones[tone].card} ${wide ? "col-span-2" : ""} rounded-[var(--md-radius-lg)] p-5 ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${tones[tone].pill}`}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-80">{label}</span>
      </div>
      <p className="font-display text-[26px] font-semibold leading-none tracking-tight">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  count,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`md-pressable flex flex-col items-start gap-3 rounded-[var(--md-radius-md)] p-4 ${
        primary
          ? "bg-[var(--md-primary)] text-[var(--md-on-primary)]"
          : "bg-[var(--md-surface-container-low)] text-[var(--md-on-surface)]"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          primary ? "bg-white/20" : "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]"
        }`}
      >
        {icon}
      </span>
      <div className="w-full">
        <p className="text-[14px] font-semibold leading-tight">{label}</p>
        <p className={`text-[12px] ${primary ? "opacity-80" : "text-[var(--md-on-surface-variant)]"}`}>
          {count} total
        </p>
      </div>
    </Link>
  );
}
