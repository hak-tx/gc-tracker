// src/app/project/[id]/page.tsx
"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [expandedScope, setExpandedScope] = useState<string | null>(null);

  const project = mockProjects.find((p) => p.id === resolvedParams.id);

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Project not found</p>
          <Link href="/" className="text-blue-400 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 shadow-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-slate-400 hover:text-white"
            >
              ← Back
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {project.name}
              </h1>
              <p className="text-slate-300 text-sm">{project.address}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Trades/Subcontractors */}
        <div className="bg-slate-800 rounded-lg shadow border border-slate-700">
          <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Trades & Scopes</h2>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm font-medium">
              + Add Trade
            </button>
          </div>

          {project.subs.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              No trades added yet
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {project.subs.map((trade) => (
                <div key={trade.id}>
                  {/* Trade Header */}
                  <div
                    className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-700 transition"
                    onClick={() =>
                      setExpandedTrade(
                        expandedTrade === trade.id ? null : trade.id
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-slate-400">
                        {expandedTrade === trade.id ? "▼" : "▶"}
                      </span>
                      <span className="font-medium text-white">{trade.name}</span>
                      <span className="text-slate-500 text-sm">
                        ({trade.scopes.length} scope
                        {trade.scopes.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <button className="text-blue-400 text-sm hover:underline">
                      + Scope
                    </button>
                  </div>

                  {/* Scopes */}
                  {expandedTrade === trade.id && (
                    <div className="bg-slate-800">
                      {trade.scopes.map((scope) => (
                        <div
                          key={scope.id}
                          className="px-6 py-3 border-t border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-700"
                          onClick={() =>
                            setExpandedScope(
                              expandedScope === scope.id ? null : scope.id
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">
                              {expandedScope === scope.id ? "▼" : "▶"}
                            </span>
                            <span className="text-slate-200">{scope.name}</span>
                            <span className="text-slate-500 text-sm">
                              ({scope.punchItems.length} items)
                            </span>
                          </div>
                          <button className="text-blue-400 text-sm hover:underline">
                            + Punch Item
                          </button>
                        </div>
                      ))}

                      {/* Punch Items */}
                      {expandedTrade === trade.id &&
                        trade.scopes.map(
                          (scope) =>
                            expandedScope === scope.id && (
                              <div key={scope.id} className="bg-slate-750">
                                {scope.punchItems.length === 0 ? (
                                  <div className="px-8 py-4 text-slate-500 text-sm">
                                    No punch items
                                  </div>
                                ) : (
                                  scope.punchItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="px-8 py-3 border-t border-slate-700 flex justify-between items-start"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-slate-200">
                                          {item.description}
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">
                                          {formatTimestamp(item.timestamp)}
                                        </p>
                                        {item.photos.length > 0 && (
                                          <p className="text-blue-400 text-xs mt-1">
                                            📷 {item.photos.length} photo
                                            {item.photos.length !== 1 ? "s" : ""}
                                          </p>
                                        )}
                                      </div>
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${statusColors[item.status]}`}
                                      >
                                        {getStatusLabel(item.status)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
