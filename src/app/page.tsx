"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Project,
  formatLabel,
  getProjectPunchItems,
  isOverdue,
  loadProjects,
  saveProjects,
  statusColors,
} from "@/lib/projects";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Project["status"]>("all");
  const [newProject, setNewProject] = useState({
    name: "",
    address: "",
    status: "active" as Project["status"],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  });

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesSearch =
        needle.length === 0 ||
        project.name.toLowerCase().includes(needle) ||
        project.address.toLowerCase().includes(needle);

      return matchesStatus && matchesSearch;
    });
  }, [projects, searchText, statusFilter]);

  const allPunchItems = useMemo(
    () => projects.flatMap((project) => getProjectPunchItems(project)),
    [projects]
  );

  const handleCreateProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name.trim(),
      address: newProject.address.trim(),
      status: newProject.status,
      startDate: newProject.startDate,
      endDate: newProject.endDate || undefined,
      trades: [],
    };

    setProjects((current) => [project, ...current]);
    setNewProject({
      name: "",
      address: "",
      status: "active",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">GC Tracker</h1>
            <p className="text-sm text-slate-400">Project & punch workflow hub</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            + New Project
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Total Projects" value={projects.length.toString()} />
          <StatCard
            label="Active"
            value={projects.filter((project) => project.status === "active").length.toString()}
            valueClass="text-emerald-300"
          />
          <StatCard
            label="Open Punch Items"
            value={allPunchItems.filter((item) => item.status !== "resolved").length.toString()}
            valueClass="text-amber-300"
          />
          <StatCard
            label="Overdue"
            value={allPunchItems.filter((item) => isOverdue(item)).length.toString()}
            valueClass="text-rose-300"
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
            placeholder="Search project or address"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | Project["status"])}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <div className="flex items-center text-sm text-slate-400 md:justify-end">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
          <header className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold">Projects</h2>
          </header>
          <div className="divide-y divide-slate-800">
            {filteredProjects.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-slate-400">No matching projects.</p>
            ) : (
              filteredProjects.map((project) => {
                const taskCount = project.trades.reduce((count, trade) => count + trade.tasks.length, 0);
                const punchCount = getProjectPunchItems(project).length;

                return (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="block px-6 py-4 transition hover:bg-slate-800/70"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium">{project.name}</h3>
                        <p className="text-sm text-slate-300">{project.address}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Start: {project.startDate}
                          {project.endDate ? ` · End: ${project.endDate}` : ""}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[project.status]}`}>
                        {formatLabel(project.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {project.trades.length} trade{project.trades.length !== 1 ? "s" : ""} · {taskCount} task
                      {taskCount !== 1 ? "s" : ""} · {punchCount} punch item{punchCount !== 1 ? "s" : ""}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-lg font-semibold">New Project</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 transition hover:text-white"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 px-6 py-5">
              <InputField
                id="project-name"
                label="Project Name"
                value={newProject.name}
                required
                onChange={(value) => setNewProject((current) => ({ ...current, name: value }))}
              />
              <InputField
                id="project-address"
                label="Address"
                value={newProject.address}
                required
                onChange={(value) => setNewProject((current) => ({ ...current, address: value }))}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputField
                  id="project-start"
                  label="Start Date"
                  value={newProject.startDate}
                  type="date"
                  required
                  onChange={(value) => setNewProject((current) => ({ ...current, startDate: value }))}
                />
                <InputField
                  id="project-end"
                  label="End Date"
                  value={newProject.endDate}
                  type="date"
                  onChange={(value) => setNewProject((current) => ({ ...current, endDate: value }))}
                />
              </div>

              <div>
                <label htmlFor="project-status" className="mb-1 block text-sm text-slate-300">
                  Status
                </label>
                <select
                  id="project-status"
                  value={newProject.status}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      status: event.target.value as Project["status"],
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${valueClass ?? "text-slate-100"}`}>{value}</p>
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  required,
  type,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "date";
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type ?? "text"}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
      />
    </div>
  );
}
