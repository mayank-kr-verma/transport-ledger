"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Truck,
  Users,
  Route,
  Receipt,
  BarChart3,
  Settings as SettingsIcon,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/trucks", label: "Trucks", icon: Truck },
  { href: "/reports/pl", label: "Reports", icon: BarChart3 },
];

const more = [
  { href: "/drivers", label: "Drivers", icon: UserCog },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bottom navigation bar — Material 3 NavigationBar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="md-safe-bottom border-t border-[var(--md-outline-variant)]/40 bg-[var(--md-surface-container)] backdrop-blur">
          <ul className="grid grid-cols-5 px-2 pt-2 pb-2">
            {tabs.map((t) => {
              const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
              const Icon = t.icon;
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl pt-1.5 pb-1.5 text-[11px] font-semibold transition-colors",
                      active ? "text-[var(--md-on-primary-container)]" : "text-[var(--md-on-surface-variant)]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-16 items-center justify-center rounded-full transition-all",
                        active
                          ? "bg-[var(--md-primary-container)] scale-100"
                          : "bg-transparent scale-95"
                      )}
                    >
                      <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />
                    </span>
                    <span className={active ? "font-bold" : ""}>{t.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden sm:fixed sm:left-0 sm:top-0 sm:flex sm:h-screen sm:w-64 sm:flex-col sm:gap-1 sm:bg-[var(--md-surface-container)] sm:p-5">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold">
            T
          </span>
          <div>
            <p className="font-display text-[17px] font-semibold leading-tight">Transport</p>
            <p className="text-xs text-[var(--md-on-surface-variant)]">Ledger</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {[...tabs, ...more].map((t) => {
            const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-3 text-[14px] font-semibold transition-colors",
                  active
                    ? "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]"
                    : "text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)]"
                )}
              >
                <Icon size={20} />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function MoreLinks() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:hidden">
      {more.map((m) => {
        const Icon = m.icon;
        return (
          <Link
            key={m.href}
            href={m.href}
            className="md-pressable flex flex-col items-center gap-2 rounded-[var(--md-radius-md)] bg-[var(--md-surface-container-low)] p-4 text-xs font-semibold text-[var(--md-on-surface)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)]">
              <Icon size={20} />
            </span>
            {m.label}
          </Link>
        );
      })}
    </div>
  );
}
