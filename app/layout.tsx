import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pipeline",
  description: "Local social pipeline for X + LinkedIn drafts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-base text-ink-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
