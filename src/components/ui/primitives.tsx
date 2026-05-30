"use client";
import * as React from "react";
import { cn } from "@/lib/cn";

/* ─────────────── BUTTON ─────────────── *
 * Material 3 button variants:
 *   filled (default) — primary CTA, saffron
 *   tonal            — secondary, primary-container
 *   outlined         — tertiary, transparent + border
 *   text             — least emphasis
 *   danger           — error
 * Shape: pill. Size: comfortable for touch.
 */
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "filled" | "tonal" | "outlined" | "text" | "danger" | "secondary" | "ghost" | "primary";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "filled", size = "md", ...props }, ref) => {
  // Map old aliases to new variants for backward compat
  const v =
    variant === "primary" ? "filled"
    : variant === "secondary" ? "tonal"
    : variant === "ghost" ? "text"
    : variant;

  const base =
    "md-pressable inline-flex items-center justify-center gap-2 rounded-[var(--md-radius-pill)] font-semibold tracking-[-0.005em] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--md-surface)] focus-visible:ring-[var(--md-primary)]";
  const variants: Record<string, string> = {
    filled: "bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-[var(--md-elev-1)] hover:shadow-[var(--md-elev-2)]",
    tonal: "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] hover:brightness-95",
    outlined: "border border-[var(--md-outline)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-low)]",
    text: "text-[var(--md-primary)] hover:bg-[var(--md-primary-container)]/60",
    danger: "bg-[var(--md-error)] text-white hover:brightness-95",
  };
  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-[15px]",
    lg: "h-14 px-8 text-base",
  };
  return <button ref={ref} className={cn(base, variants[v], sizes[size], className)} {...props} />;
});
Button.displayName = "Button";

/* ─────────────── FAB ─────────────── */
export const Fab = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    extended?: boolean;
    icon?: React.ReactNode;
  }
>(({ className, extended, icon, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "md-pressable fixed right-5 z-30 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] font-semibold shadow-[var(--md-elev-3)] hover:shadow-[var(--md-elev-4)]",
        extended ? "h-14 px-5 text-[15px]" : "h-14 w-14 rounded-2xl text-[15px]",
        "md-fab-bottom sm:bottom-8",
        className
      )}
      {...props}
    >
      {icon}
      {extended && <span>{children}</span>}
      {!extended && children}
    </button>
  );
});
Fab.displayName = "Fab";

/* ─────────────── INPUT (outlined Material 3) ─────────────── */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-14 w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] px-4 text-[15px] outline-none transition-colors",
        "placeholder:text-[var(--md-on-surface-variant)]",
        "focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] p-4 text-[15px] outline-none",
        "placeholder:text-[var(--md-on-surface-variant)]",
        "focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-14 w-full appearance-none rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] px-4 pr-10 text-[15px] outline-none transition-colors",
        "focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20",
        "bg-[image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22 fill=%22none%22><path d=%22M6 8l4 4 4-4%22 stroke=%22%235c5040%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--md-on-surface-variant)]",
        className
      )}
    >
      {children}
    </label>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-[var(--md-on-surface-variant)]">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-[var(--md-error)]">{error}</p>}
    </div>
  );
}

/* ─────────────── CARD (tonal surface) ─────────────── */
export function Card({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "low" | "high" | "primary" | "tertiary";
}) {
  const tones: Record<string, string> = {
    default: "bg-[var(--md-surface-container-low)] text-[var(--md-on-surface)]",
    low: "bg-[var(--md-surface-container-lowest)] text-[var(--md-on-surface)]",
    high: "bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]",
    primary: "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]",
    tertiary: "bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)]",
  };
  return (
    <div className={cn("rounded-[var(--md-radius-lg)] p-5", tones[tone], className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--md-on-surface-variant)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--md-radius-lg)] bg-[var(--md-surface-container)] p-10 text-center">
      <p className="text-[15px] text-[var(--md-on-surface-variant)]">{message}</p>
      {action}
    </div>
  );
}

/* ─────────────── List item (M3) ─────────────── */
export function ListItem({
  leading,
  title,
  supporting,
  trailing,
  onClick,
  className,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  supporting?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "md-pressable flex items-center gap-4 rounded-[var(--md-radius-lg)] bg-[var(--md-surface-container-low)] px-4 py-4",
        onClick && "cursor-pointer hover:bg-[var(--md-surface-container)]",
        className
      )}
    >
      {leading && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">
          {leading}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold leading-tight">{title}</div>
        {supporting && (
          <div className="mt-0.5 truncate text-[13px] text-[var(--md-on-surface-variant)]">{supporting}</div>
        )}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </div>
  );
}

/* ─────────────── Chip ─────────────── */
export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "primary" | "warning";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]",
    success: "bg-[var(--md-success-container)] text-[var(--md-on-success-container)]",
    danger: "bg-[var(--md-error-container)] text-[var(--md-on-error-container)]",
    primary: "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]",
    warning: "bg-[#ffe3a8] text-[#3b2700]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
