import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "SHeine Pipeline",
  description: "Local social pipeline for SHeine Brief + sheine.ai",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" >
      <body className="bg-bg-base text-ink-900 min-h-screen">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
