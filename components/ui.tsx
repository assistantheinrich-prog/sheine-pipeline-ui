"use client";

import clsx from "clsx";
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from "react";

export function Card({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "bg-navy-card border border-border-subtle rounded-md p-4",
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
      "bg-gold text-navy-dark font-semibold hover:bg-gold-soft border border-transparent",
    secondary:
      "bg-transparent border border-border-strong text-text-white hover:bg-navy-elev2",
    ghost:
      "bg-transparent text-cyan hover:underline border border-transparent",
    destructive:
      "bg-rose/10 text-rose border border-rose/30 hover:bg-rose/15",
  }[variant];
  const sz = size === "sm" ? "px-2 h-7 text-xs" : "px-3 h-9 text-sm";
  return (
    <button
      className={clsx(
        "rounded-sm transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed",
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
    pending: "text-amber bg-amber/10 border-amber/20",
    approved: "text-gold bg-gold/10 border-gold/20",
    posted: "text-cyan bg-cyan/10 border-cyan/20",
    rejected: "text-rose bg-rose/10 border-rose/20",
    draft: "text-text-gray bg-navy-card border-border-subtle",
  }[s] || "text-text-gray bg-navy-card border-border-subtle";

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
    <span className="inline-flex items-center px-1.5 h-5 rounded-xs bg-navy-elev2 text-text-gray text-[11px] font-semibold uppercase tracking-label">
      {label}
    </span>
  );
}

export function H1({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={clsx("font-cinzel font-bold text-[2.25rem] tracking-cinzel-tight text-text-white", className)}>
      {children}
    </h1>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={clsx("font-cinzel font-semibold text-[1.75rem] tracking-cinzel-tight text-text-white", className)}>
      {children}
    </h2>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "text-[11px] font-semibold uppercase tracking-label text-text-gray",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-12 text-text-gray font-cinzel italic text-sm">
      {children}
    </div>
  );
}
