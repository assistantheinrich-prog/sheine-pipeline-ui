"use client";

import clsx from "clsx";
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from "react";

export function Card({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "bg-bg-surface border border-line-subtle rounded-md p-4 shadow-card",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md";
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const styles = {
    primary:
      "bg-ink-900 text-white hover:bg-ink-700 border border-transparent",
    secondary:
      "bg-bg-surface border border-line-strong text-ink-900 hover:bg-bg-subtle",
    ghost:
      "bg-transparent text-brand hover:underline border border-transparent",
    destructive:
      "bg-bg-surface text-danger border border-line-subtle hover:bg-red-50",
  }[variant];
  const sz = size === "sm" ? "px-2 h-7 text-xs" : "px-3 h-9 text-sm";
  return (
    <button
      className={clsx(
        "rounded-sm transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium",
        sz,
        styles,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const style = {
    pending:  "text-warn bg-warn/10 border-warn/30",
    approved: "text-success bg-success/10 border-success/30",
    posted:   "text-brand bg-brand/10 border-brand/30",
    rejected: "text-danger bg-danger/10 border-danger/30",
    draft:    "text-ink-400 bg-bg-subtle border-line-subtle",
  }[s] || "text-ink-400 bg-bg-subtle border-line-subtle";

  return (
    <span
      className={clsx(
        "inline-flex items-center px-1.5 h-5 rounded-xs border text-[11px] font-semibold uppercase tracking-label",
        style
      )}
    >
      {s || "?"}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  const p = (platform || "").toLowerCase();
  const label = p === "x" ? "X" : p === "linkedin" ? "LI" : p.toUpperCase();
  return (
    <span className="inline-flex items-center px-1.5 h-5 rounded-xs bg-bg-subtle text-ink-500 text-[11px] font-semibold uppercase tracking-label border border-line-subtle">
      {label}
    </span>
  );
}

export function H1({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={clsx("font-sans font-semibold text-[1.875rem] tracking-tight text-ink-900", className)}>
      {children}
    </h1>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={clsx("font-sans font-semibold text-[1.375rem] tracking-tight text-ink-900", className)}>
      {children}
    </h2>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "text-[11px] font-semibold uppercase tracking-label text-ink-400",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-12 text-ink-400 text-sm">
      {children}
    </div>
  );
}
