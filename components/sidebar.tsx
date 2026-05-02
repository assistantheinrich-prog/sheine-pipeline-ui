"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  PenLine,
  Inbox,
  CalendarClock,
  BarChart3,
  Library,
  Users,
  Settings,
  BookOpen,
} from "lucide-react";

const items = [
  { href: "/", label: "Composer", icon: PenLine },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/queue", label: "Queue", icon: CalendarClock },
  { href: "/research", label: "Research", icon: BookOpen },
  { href: "/library", label: "Library", icon: Library },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/kols", label: "KOLs", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 bg-bg-subtle border-r border-line-subtle h-screen sticky top-0 px-4 py-6 flex flex-col">
      <div className="mb-8 px-2">
        <div className="font-sans text-[1.25rem] text-brand tracking-tight">SHeine</div>
        <div className="text-[10px] uppercase tracking-label text-ink-400 mt-0.5">Pipeline</div>
      </div>
      <nav className="flex-1 flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href as any}
              className={clsx(
                "flex items-center gap-3 px-2 h-9 rounded-sm text-sm transition-colors",
                active
                  ? "bg-bg-surface text-ink-900 border border-line-subtle shadow-card"
                  : "text-ink-500 hover:bg-bg-surface hover:text-ink-900 border border-transparent"
              )}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="text-[11px] text-ink-400 font-mono px-2">
        © 2026 sheine.ai
      </div>
    </aside>
  );
}
