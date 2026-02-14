import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GC Tracker - Contractor Project Management",
  description: "Project > Trade > Task > PunchItem tracking with Gantt timeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="antialiased">{children}</body>
    </html>
  );
}
