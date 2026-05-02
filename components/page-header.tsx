import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  label,
  title,
  rightSlot,
}: {
  label: string;
  title: ReactNode;
  rightSlot?: ReactNode;
}) {
  return (
    <header className="border-b border-line-subtle">
      <div className="h-12 px-6 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[12.5px] text-ink-500 hover:text-ink-900"
        >
          <ChevronLeft size={14} />
          Composer
        </Link>
        <span className="text-ink-300">/</span>
        <span className="text-[10.5px] uppercase tracking-label text-ink-400 font-semibold">
          {label}
        </span>
        <span className="font-mono text-[12.5px] text-ink-700 truncate">{title}</span>
        {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      </div>
    </header>
  );
}
