const howItWorks = [
  {
    title: "Connect your subs",
    copy: "Send each subcontractor a text or Telegram thread. No new app installs, no retraining.",
  },
  {
    title: "Capture field updates",
    copy: "Subs reply with status, delivery dates, blockers, and change notes in plain language.",
  },
  {
    title: "FactorGC updates the plan",
    copy: "The agent updates schedule and budget forecasts automatically and flags slippage early.",
  },
  {
    title: "Run from one dashboard",
    copy: "View Gantt timelines, bid-vs-actual per trade, and a complete audit trail for every decision.",
  },
];

const features = [
  "Text + Telegram communication with subcontractors",
  "Automatic schedule adjustments from live responses",
  "Spanish-to-English translation for field teams",
  "Full legal-grade audit trail for disputes and insurance",
  "Gantt chart dashboard for milestone and dependency visibility",
  "Bid vs actual tracking per subcontractor in real time",
  "Acts as a digital PM assistant for lean GC teams",
];

const pains = [
  "Your PMs spend hours chasing status updates instead of managing risk.",
  "Critical delays surface too late because updates are buried in group chats.",
  "Language barriers with crews create avoidable rework and schedule drift.",
  "When claims happen, documentation is incomplete or impossible to piece together.",
];

const pricing = [
  {
    name: "Basic",
    price: "$299/mo",
    target: "Small GCs running a few active jobs",
    bullets: ["Up to 5 active projects", "Core messaging + schedule tracking", "Audit trail + weekly exports"],
  },
  {
    name: "Pro",
    price: "$899/mo",
    target: "Growing contractors managing multiple crews",
    bullets: [
      "Up to 20 active projects",
      "Advanced Gantt + bid-vs-actual analytics",
      "Priority support + multilingual workflows",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    target: "Multi-office teams with compliance requirements",
    bullets: ["Unlimited projects", "Custom integrations + reporting", "Dedicated onboarding + SLA"],
  },
];

export default function Home() {
  return (
    <main className="section-grid">
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-28 md:pt-16">
        <div className="rounded-3xl border border-line/90 bg-panel/65 p-8 shadow-glow backdrop-blur-xl md:p-14">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accentSoft">
            AI Agent for Construction PM
          </p>
          <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight text-white md:text-6xl">
            Keep every subcontractor aligned with one AI project manager.
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300 md:text-xl">
            FactorGC runs project coordination over text and Telegram, tracks schedule and budget automatically,
            translates Spanish updates, and gives GCs a live command dashboard.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="https://gc-tracker-hakel.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-accentSoft"
            >
              Book a Live Demo
            </a>
            <a
              href="#pricing"
              className="rounded-xl border border-line bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-accent/70 hover:text-accentSoft"
            >
              View Pricing
            </a>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-slate-950/60 p-4">
              <p className="text-2xl font-semibold text-white">24/7</p>
              <p className="text-sm text-slate-400">Sub update ingestion without manual follow-ups</p>
            </div>
            <div className="rounded-xl border border-line bg-slate-950/60 p-4">
              <p className="text-2xl font-semibold text-white">Bilingual</p>
              <p className="text-sm text-slate-400">Spanish to English translation built into every thread</p>
            </div>
            <div className="rounded-xl border border-line bg-slate-950/60 p-4">
              <p className="text-2xl font-semibold text-white">Claim-ready</p>
              <p className="text-sm text-slate-400">Complete documented trail for legal and insurance defense</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">How It Works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {howItWorks.map((item, idx) => (
            <article key={item.title} className="card-shine rounded-2xl border border-line bg-panel/80 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accentSoft">Step {idx + 1}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-slate-300">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-line bg-panel/75 p-8 md:p-10">
          <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Feature Set Built for GCs</h2>
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="rounded-xl border border-line bg-slate-950/60 p-4 text-slate-200">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-20 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-line bg-panel/80 p-8 md:p-10">
          <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Why GCs Need This Now</h2>
          <div className="mt-7 space-y-4">
            {pains.map((pain) => (
              <p key={pain} className="rounded-xl border border-line bg-slate-950/60 p-4 text-slate-300">
                {pain}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-highlight/40 bg-gradient-to-b from-highlight/20 via-amber-700/5 to-transparent p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-highlight">Bottom line</p>
          <h3 className="mt-3 font-display text-3xl font-semibold text-white">Ship more jobs with less PM overhead.</h3>
          <p className="mt-4 text-slate-300">
            FactorGC compresses project communication into an always-on operating layer, so your team stays ahead of schedule risk and budget drift.
          </p>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">Pricing</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {pricing.map((tier) => (
            <article
              key={tier.name}
              className={`rounded-2xl border p-6 ${
                tier.featured
                  ? "border-accent bg-gradient-to-b from-accent/20 via-panel to-panel shadow-glow"
                  : "border-line bg-panel/80"
              }`}
            >
              <p className="font-display text-xl font-semibold text-white">{tier.name}</p>
              <p className="mt-2 text-3xl font-bold text-accentSoft">{tier.price}</p>
              <p className="mt-2 text-sm text-slate-300">{tier.target}</p>
              <ul className="mt-5 space-y-3">
                {tier.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-lg border border-line/80 bg-slate-950/55 p-3 text-sm text-slate-200">
                    {bullet}
                  </li>
                ))}
              </ul>
              <a
                href="https://gc-tracker-hakel.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
              >
                Request Demo
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-accent/40 bg-gradient-to-r from-accent/20 via-panel to-panel p-8 text-center md:p-12">
          <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">
            Ready to run your projects with an AI PM?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Give FactorGC one live project and see how quickly updates, documentation, and scheduling discipline improve.
          </p>
          <a
            href="https://gc-tracker-hakel.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-xl bg-accent px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-accentSoft"
          >
            Book Demo
          </a>
        </div>
      </section>
    </main>
  );
}
