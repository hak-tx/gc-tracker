"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProjects, formatDate, statusColors, Project } from "@/lib/projects";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProjects(loadProjects());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-white">
              FactorGC
            </Link>
            <span className="text-sm text-slate-400">Demo Projects</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-white">Example Projects</h1>
        <p className="mt-2 text-slate-400">
          Browse these demo projects to see FactorGC in action.
        </p>

        <div className="mt-8 grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group block rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-cyan-400">
                    {project.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">{project.address}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : "Ongoing"}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[project.status as keyof typeof statusColors]}`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <h3 className="text-lg font-semibold text-white">What you&apos;re seeing:</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>• <strong className="text-white">Gantt Timeline</strong> - Visual schedule across all trades</li>
            <li>• <strong className="text-white">Task Status</strong> - Not started, in progress, completed, blocked</li>
            <li>• <strong className="text-white">Punch Items</strong> - Open, in progress, resolved with priorities</li>
            <li>• <strong className="text-white">Dependencies</strong> - Tasks that must complete before others start</li>
            <li>• <strong className="text-white">Sub Updates</strong> - Text messages that update schedule automatically</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
