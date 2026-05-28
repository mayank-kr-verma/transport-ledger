import type { Metadata, Viewport } from "next";
import "./globals.css";
import PinGate from "@/components/PinGate";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Transport Ledger",
  description: "Local-first ledger for transport businesses",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Transport Ledger" },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <PinGate>
          <BottomNav />
          <main className="mx-auto max-w-4xl px-4 pb-24 pt-4 sm:ml-56 sm:max-w-none sm:px-8 sm:pb-8">
            {children}
          </main>
        </PinGate>
      </body>
    </html>
  );
}
