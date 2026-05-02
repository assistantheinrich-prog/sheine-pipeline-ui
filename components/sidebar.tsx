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
    <aside className="w-60 shrink-0 bg-bg-subtle border-r border-line-subtle h-screen sticky top-0 px-3 py-5 flex flex-col">
      <div className="mb-7 px-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-sm bg-ink-900 flex items-center justify-center text-white text-[13px] font-semibold tracking-tight">
          P
        </div>
        <div>
          <div className="font-sans text-[14px] font-semibold text-ink-900 tracking-tight leading-tight">Pipeline</div>
          <div className="text-[10px] uppercase tracking-label text-ink-400 leading-tight">Local · v0.1</div>
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-px">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href as any}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 h-8 rounded-sm text-[13.5px] transition-colors",
                active
                  ? "bg-bg-surface text-ink-900 border border-line-subtle shadow-card"
                  : "text-ink-500 hover:bg-bg-surface hover:text-ink-900 border border-transparent"
              )}
            >
              <Icon size={15} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 mt-4">
        <div className="border-t border-line-subtle pt-3 text-[10.5px] uppercase tracking-label text-ink-400">
          shortcuts
        </div>
        <ul className="mt-2 space-y-1 text-[12px] font-mono text-ink-500">
          <li className="flex justify-between"><span>research-run</span></li>
          <li className="flex justify-between"><span>research-draft</span></li>
          <li className="flex justify-between"><span>social-due</span></li>
        </ul>
      </div>
    </aside>
  );
}
