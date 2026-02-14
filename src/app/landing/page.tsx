import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });

export const metadata: Metadata = {
  title: "FactorGC — Automated Construction Project Management",
  description: "Automated subcontractor coordination, scheduling, and documentation. Your 24/7 project manager.",
};

export default function Home() {
  return (
    <main className="section-grid">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-16 text-center">
        {/* Logo */}
        <img
          src="/factorgc-wordmark.jpg"
          alt="FactorGC"
          className="mx-auto max-w-md"
        />
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          Automated Construction Management System
        </p>
        <a
          href="https://gc-tracker-hakel.vercel.app"
          target="_blank"
          className="mt-10 inline-block rounded-xl bg-white px-8 py-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          See It In Action
        </a>
      </section>

      {/* What It Does */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="text-center font-[var(--font-sora)] text-3xl font-semibold text-white">
          What FactorGC Does
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Automated Check-Ins",
              desc: "Agent messages subs daily. No more chasing. No more phone calls.",
            },
            {
              title: "Schedule Updates",
              desc: "Subs respond with status — early, on time, or delayed. Schedule updates automatically.",
            },
            {
              title: "Free for Subs",
              desc: "Subs use Telegram — free for them. No app to download, no account needed.",
            },
            {
              title: "Documentation",
              desc: "Every update stored and organized. Know exactly what happened and when.",
            },
            {
              title: "24/7 Availability",
              desc: "Agent is always awake. Asks questions. Makes adjustments. Keeps things moving.",
            },
            {
              title: "Translation Built In",
              desc: "Subs text in Spanish. Agent translates. You understand everything.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="font-[var(--font-sora)] text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="text-center font-[var(--font-sora)] text-3xl font-semibold text-white">
          How It Works
        </h2>
        <div className="mt-10 space-y-4">
          {[
            {
              step: "1",
              title: "Connect Your Subs",
              desc: "Add subcontractor contacts. Agent sends them a message on Telegram.",
            },
            {
              step: "2",
              title: "Agent Handles The Rest",
              desc: "Daily check-ins. Status updates. Schedule adjustments. All automatic.",
            },
            {
              step: "3",
              title: "You Stay Informed",
              desc: "Check dashboard when you want. Know exactly where every trade stands.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6 rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-600 text-xl font-bold text-white">
                {item.step}
              </div>
              <div>
                <h3 className="font-[var(--font-sora)] text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-slate-300">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="rounded-3xl border border-slate-700 bg-slate-800/50 p-10">
          <h2 className="font-[var(--font-sora)] text-3xl font-semibold text-white">
            Ready to stop chasing subs?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            See how FactorGC runs your project automatically.
          </p>
          <a
            href="https://gc-tracker-hakel.vercel.app"
            target="_blank"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Try The Demo
          </a>
        </div>
      </section>
    </main>
  );
}
