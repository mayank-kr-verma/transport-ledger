"use client";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, readSettings, ensureSettings } from "@/db/schema";
import { hashPin, verifyPin } from "@/lib/pin";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const SESSION_KEY = "tl_unlocked";

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"enter" | "confirm">("enter");
  const settings = useLiveQuery(() => readSettings(), []);

  useEffect(() => {
    ensureSettings();
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
  }, []);

  if (settings === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--md-surface)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--md-primary-container)] border-t-[var(--md-primary)]" />
      </div>
    );
  }
  if (unlocked) return <>{children}</>;

  const hasPin = !!settings.pinHash;

  const onKey = (k: string) => {
    setError("");
    const target = phase === "confirm" ? setPin2 : setPin;
    const current = phase === "confirm" ? pin2 : pin;
    if (k === "del") {
      target(current.slice(0, -1));
      return;
    }
    if (current.length >= 4) return;
    const next = current + k;
    target(next);

    if (next.length === 4) {
      // auto-advance
      setTimeout(() => submit(next), 120);
    }
  };

  const submit = async (entered?: string) => {
    const enteredPin = phase === "enter" ? (entered ?? pin) : pin;
    const enteredPin2 = phase === "confirm" ? (entered ?? pin2) : pin2;

    if (!hasPin) {
      if (phase === "enter") {
        if (enteredPin.length !== 4) return;
        setPhase("confirm");
        return;
      }
      // confirm phase
      if (enteredPin2.length !== 4) return;
      if (pin !== enteredPin2) {
        setError("PINs don't match. Try again.");
        setPin2("");
        return;
      }
      const { hash, salt } = await hashPin(pin);
      await db.settings.put({ ...settings, pinHash: hash, salt });
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      const ok = await verifyPin(enteredPin, settings.pinHash!, settings.salt!);
      if (!ok) {
        setError("Wrong PIN.");
        setPin("");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    }
  };

  const value = phase === "confirm" ? pin2 : pin;
  const title = hasPin ? "Welcome back" : phase === "enter" ? "Create a PIN" : "Confirm your PIN";
  const sub = hasPin
    ? "Enter your 4-digit PIN"
    : phase === "enter"
    ? "Pick 4 digits to protect your ledger"
    : "Re-enter the same 4 digits";

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--md-surface)] overflow-hidden">
      <div className="md-wallpaper" style={{ inset: "-20% -20% 30% -20%", height: "70vh" }} />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-[var(--md-elev-3)]">
          <span className="font-display text-4xl font-bold">₹</span>
        </div>
        <h1 className="font-display text-[32px] font-semibold tracking-tight text-center">{title}</h1>
        <p className="mt-2 mb-10 text-[15px] text-[var(--md-on-surface-variant)] text-center">{sub}</p>

        {/* PIN dots */}
        <div className="mb-3 flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-4 w-4 rounded-full transition-all",
                value.length > i
                  ? "bg-[var(--md-primary)] scale-110"
                  : "bg-[var(--md-outline-variant)]"
              )}
            />
          ))}
        </div>

        <div className="mb-8 h-5 text-sm font-medium text-[var(--md-error)]">{error}</div>

        {/* Keypad */}
        <div className="grid w-full max-w-xs grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
            <button
              key={k}
              onClick={() => onKey(k)}
              className="md-pressable h-16 rounded-2xl bg-[var(--md-surface-container)] text-2xl font-semibold text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)]"
            >
              {k}
            </button>
          ))}
          <div />
          <button
            onClick={() => onKey("0")}
            className="md-pressable h-16 rounded-2xl bg-[var(--md-surface-container)] text-2xl font-semibold text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)]"
          >
            0
          </button>
          <button
            onClick={() => onKey("del")}
            className="md-pressable h-16 rounded-2xl text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-low)]"
            aria-label="Delete"
          >
            ⌫
          </button>
        </div>

        {!hasPin && phase === "confirm" && (
          <Button
            variant="text"
            className="mt-6"
            onClick={() => {
              setPhase("enter");
              setPin("");
              setPin2("");
              setError("");
            }}
          >
            ← Change PIN
          </Button>
        )}
      </div>
    </div>
  );
}
