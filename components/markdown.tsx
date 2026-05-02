"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

export function MarkdownView({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  return (
    <div className={clsx("markdown text-[13.5px] leading-[1.65] text-ink-700", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[1.5rem] font-semibold text-ink-900 mt-7 mb-4 tracking-tight first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[1.125rem] font-semibold text-ink-900 mt-7 mb-3 tracking-tight first:mt-0 pb-1.5 border-b border-line-subtle">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[0.95rem] font-semibold text-ink-900 mt-5 mb-2 tracking-tight first:mt-0">
              <span className="font-mono text-brand mr-2 text-[0.85rem]">›</span>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[11px] font-semibold uppercase tracking-label text-ink-400 mt-5 mb-2 first:mt-0">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="my-2.5 text-ink-700">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-brand hover:underline decoration-brand/40 underline-offset-2 break-words"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="text-ink-900 font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic text-ink-500">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-3 space-y-1.5 list-none">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 space-y-1.5 list-decimal list-inside marker:text-ink-400">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-ink-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:top-0 before:text-ink-300">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-line-strong pl-4 text-ink-500 italic">{children}</blockquote>
          ),
          code: ({ children, className: cls }) => {
            const inline = !cls?.startsWith("language-");
            if (inline) {
              return (
                <code className="font-mono text-[0.825rem] bg-bg-subtle border border-line-subtle rounded-xs px-1 py-px text-ink-900">
                  {children}
                </code>
              );
            }
            return <code className={cls}>{children}</code>;
          },
          pre: ({ children }) => (
            <pre className="my-3 bg-bg-subtle border border-line-subtle rounded-sm p-3 overflow-x-auto text-[12.5px] font-mono text-ink-900">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-6 border-line-subtle" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-sm border border-line-subtle">
              <table className="w-full text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-bg-subtle">{children}</thead>,
          th: ({ children }) => (
            <th className="text-left font-semibold uppercase tracking-label text-[11px] text-ink-500 px-3 py-2 border-b border-line-subtle">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-line-subtle text-ink-700">{children}</td>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
