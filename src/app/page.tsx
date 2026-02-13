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

  const totalPunchItems = useMemo(
    () => projects.flatMap((project) => getProjectPunchItems(project)),
    [projects]
  );

  const overdueCount = useMemo(
    () => totalPunchItems.filter((item) => isOverdue(item)).length,
    [totalPunchItems]
  );

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name.trim(),
      address: newProject.address.trim(),
      status: newProject.status,
      startDate: new Date().toISOString().slice(0, 10),
      subs: [],
    };

    setProjects((currentProjects) => [project, ...currentProjects]);
    setNewProject({ name: "", address: "", status: "active" });
    setIsModalOpen(false);
  };

  const closeModal = () => {
    setNewProject({ name: "", address: "", status: "active" });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-white">GC Tracker</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-600"
          >
            + New Project
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-slate-800 p-6 shadow">
            <p className="text-sm text-slate-400">Total Projects</p>
            <p className="text-3xl font-bold text-white">{projects.length}</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-6 shadow">
            <p className="text-sm text-slate-400">Active</p>
            <p className="text-3xl font-bold text-green-400">
              {projects.filter((p) => p.status === "active").length}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800 p-6 shadow">
            <p className="text-sm text-slate-400">Open Punch Items</p>
            <p className="text-3xl font-bold text-orange-300">
              {totalPunchItems.filter((item) => item.status !== "resolved").length}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800 p-6 shadow">
            <p className="text-sm text-slate-400">Overdue</p>
            <p className="text-3xl font-bold text-rose-400">{overdueCount}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
            placeholder="Search project or address"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | Project["status"])}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
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

        <div className="rounded-lg border border-slate-700 bg-slate-800 shadow">
          <div className="border-b border-slate-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Projects</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {filteredProjects.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-400">
                No projects match your filters.
              </div>
            ) : (
              filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="block px-6 py-4 transition hover:bg-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-300">{project.address}</p>
                      <p className="mt-1 text-xs text-slate-500">Started: {project.startDate}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[project.status]}`}
                    >
                      {formatLabel(project.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {project.subs.length} trade{project.subs.length !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">New Project</h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 transition hover:text-white"
                aria-label="Close new project modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 px-6 py-5">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-1 block text-sm font-medium text-slate-200"
                >
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label
                  htmlFor="project-address"
                  className="mb-1 block text-sm font-medium text-slate-200"
                >
                  Address
                </label>
                <input
                  id="project-address"
                  type="text"
                  required
                  value={newProject.address}
                  onChange={(e) =>
                    setNewProject((current) => ({
                      ...current,
                      address: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
                  placeholder="Enter project address"
                />
              </div>

              <div>
                <label
                  htmlFor="project-status"
                  className="mb-1 block text-sm font-medium text-slate-200"
                >
                  Status
                </label>
                <select
                  id="project-status"
                  value={newProject.status}
                  onChange={(e) =>
                    setNewProject((current) => ({
                      ...current,
                      status: e.target.value as Project["status"],
                    }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-600 px-4 py-2 font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-600"
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
