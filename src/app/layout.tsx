import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import PinGate from "@/components/PinGate";
import BottomNav from "@/components/BottomNav";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Transport Ledger",
  description: "Local-first ledger for transport businesses",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Transport Ledger" },
};

export const viewport: Viewport = {
  themeColor: "#ea6a14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <PinGate>
          <BottomNav />
          <main className="md-safe-top relative mx-auto max-w-3xl px-5 pb-40 pt-5 sm:ml-64 sm:max-w-none sm:px-10 sm:pb-10 sm:pt-8">
            {children}
          </main>
        </PinGate>
      </body>
    </html>
  );
}
