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
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  open: "bg-red-100 text-red-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

export default function Dashboard() {
  const [projects] = useState<Project[]>(mockProjects);

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">GC Tracker</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + New Project
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Projects</p>
            <p className="text-3xl font-bold">{projects.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {projects.filter((p) => p.status === "active").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-3xl font-bold text-blue-600">
              {projects.filter((p) => p.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">On Hold</p>
            <p className="text-3xl font-bold text-yellow-600">
              {projects.filter((p) => p.status === "on_hold").length}
            </p>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Projects</h2>
          </div>
          <div className="divide-y">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {project.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {project.address}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
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
                  <p className="text-gray-500 text-sm mt-2">
                    {project.subs.length} trade{project.subs.length !== 1 ? "s" : ""}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
