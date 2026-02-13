// src/app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

// Types
interface PunchItem {
  id: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  timestamp: string;
  photos: string[];
}

interface Scope {
  id: string;
  name: string;
  punchItems: PunchItem[];
}

interface SubTrade {
  id: string;
  name: string;
  scopes: Scope[];
}

interface Project {
  id: string;
  name: string;
  address: string;
  status: "active" | "completed" | "on_hold";
  startDate: string;
  subs: SubTrade[];
}

// Mock data
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Riverside Office Renovation",
    address: "123 Main St, Austin, TX",
    status: "active",
    startDate: "2026-01-15",
    subs: [
      {
        id: "s1",
        name: "Electrical",
        scopes: [
          {
            id: "sc1",
            name: "Lighting Fixtures",
            punchItems: [
              {
                id: "p1",
                description: "Install pendant lights in lobby",
                status: "open",
                timestamp: "2026-02-10T09:30:00",
                photos: [],
              },
              {
                id: "p2",
                description: "Replace switch in break room",
                status: "resolved",
                timestamp: "2026-02-08T14:15:00",
                photos: [],
              },
            ],
          },
        ],
      },
      {
        id: "s2",
        name: "Plumbing",
        scopes: [
          {
            id: "sc2",
            name: "Restroom Fixtures",
            punchItems: [
              {
                id: "p3",
                description: "Fix leaky faucet in men's room",
                status: "in_progress",
                timestamp: "2026-02-11T10:00:00",
                photos: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Downtown Loft Build",
    address: "456 Congress Ave, Austin, TX",
    status: "active",
    startDate: "2026-02-01",
    subs: [],
  },
  {
    id: "3",
    name: "Lake House Remodel",
    address: "789 Lakeview Dr, Lake Travis, TX",
    status: "completed",
    startDate: "2025-11-01",
    subs: [],
  },
];

const statusColors = {
  active: "bg-green-600 text-white",
  completed: "bg-blue-600 text-white",
  on_hold: "bg-yellow-500 text-white",
  open: "bg-red-600 text-white",
  in_progress: "bg-orange-500 text-white",
  resolved: "bg-gray-600 text-white",
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    address: "",
    status: "active" as Project["status"],
  });

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

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
      {/* Header */}
      <header className="bg-slate-800 shadow-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">GC Tracker</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-medium"
          >
            + New Project
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg shadow p-6">
            <p className="text-sm text-slate-400">Total Projects</p>
            <p className="text-3xl font-bold text-white">{projects.length}</p>
          </div>
          <div className="bg-slate-800 rounded-lg shadow p-6">
            <p className="text-sm text-slate-400">Active</p>
            <p className="text-3xl font-bold text-green-400">
              {projects.filter((p) => p.status === "active").length}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg shadow p-6">
            <p className="text-sm text-slate-400">Completed</p>
            <p className="text-3xl font-bold text-blue-400">
              {projects.filter((p) => p.status === "completed").length}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg shadow p-6">
            <p className="text-sm text-slate-400">On Hold</p>
            <p className="text-3xl font-bold text-yellow-400">
              {projects.filter((p) => p.status === "on_hold").length}
            </p>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-slate-800 rounded-lg shadow border border-slate-700">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Projects</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="block px-6 py-4 hover:bg-slate-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {project.name}
                    </h3>
                    <p className="text-slate-300 text-sm mt-1 font-medium">
                      {project.address}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Started: {project.startDate}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                {project.subs.length > 0 && (
                  <p className="text-slate-400 text-sm mt-2">
                    {project.subs.length} trade{project.subs.length !== 1 ? "s" : ""}
                  </p>
                )}
              </Link>
            ))}
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
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 outline-none ring-0 transition focus:border-blue-500"
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
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 outline-none ring-0 transition focus:border-blue-500"
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
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none ring-0 transition focus:border-blue-500"
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
