"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Truck, Users, Route, Receipt, BarChart3, Settings as SettingsIcon, UserCog } from "lucide-react";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/trucks", label: "Trucks", icon: Truck },
  { href: "/reports/pl", label: "P&L", icon: BarChart3 },
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
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        <nav className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs",
                  active ? "text-blue-600" : "text-slate-500"
                )}
              >
                <Icon size={20} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <aside className="hidden sm:fixed sm:left-0 sm:top-0 sm:flex sm:h-screen sm:w-56 sm:flex-col sm:border-r sm:border-slate-200 sm:bg-white sm:p-4">
        <div className="mb-6 text-lg font-bold text-slate-900">Transport Ledger</div>
        <nav className="space-y-1">
          {[...tabs, ...more].map((t) => {
            const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon size={18} />
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
    <div className="grid grid-cols-3 gap-2 sm:hidden">
      {more.map((m) => {
        const Icon = m.icon;
        return (
          <Link
            key={m.href}
            href={m.href}
            className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700"
          >
            <Icon size={20} />
            {m.label}
          </Link>
        );
      })}
    </div>
  );
}
