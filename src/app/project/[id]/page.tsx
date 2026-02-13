"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  Project,
  PunchPriority,
  PunchStatus,
  formatLabel,
  formatTimestamp,
  isOverdue,
  loadProjects,
  priorityColors,
  saveProjects,
  statusColors,
} from "@/lib/projects";

interface PunchDraft {
  description: string;
  priority: PunchPriority;
  assignee: string;
  dueDate: string;
  status: PunchStatus;
}

const defaultPunchDraft: PunchDraft = {
  description: "",
  priority: "medium",
  assignee: "",
  dueDate: "",
  status: "open",
};

const createNextId = (prefix: string, existingIds: string[]) => {
  const normalizedExistingIds = new Set(existingIds);
  let sequence = existingIds.length + 1;

  while (normalizedExistingIds.has(`${prefix}${sequence}`)) {
    sequence += 1;
  }

  return `${prefix}${sequence}`;
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [expandedScope, setExpandedScope] = useState<string | null>(null);

  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [newTradeName, setNewTradeName] = useState("");

  const [addingScopeTradeId, setAddingScopeTradeId] = useState<string | null>(null);
  const [newScopeName, setNewScopeName] = useState("");

  const [addingPunchScopeKey, setAddingPunchScopeKey] = useState<string | null>(null);
  const [newPunchItem, setNewPunchItem] = useState<PunchDraft>(defaultPunchDraft);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const project = useMemo(
    () => projects.find((entry) => entry.id === resolvedParams.id),
    [projects, resolvedParams.id]
  );

  const handleAddTrade = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) {
      return;
    }

    const trimmedName = newTradeName.trim();
    if (!trimmedName) {
      return;
    }

    let tradeId = "";
    setProjects((currentProjects) =>
      currentProjects.map((entry) => {
        if (entry.id !== project.id) {
          return entry;
        }

        tradeId = createNextId(
          "s",
          entry.subs.map((trade) => trade.id)
        );

        return {
          ...entry,
          subs: [...entry.subs, { id: tradeId, name: trimmedName, scopes: [] }],
        };
      })
    );

    setExpandedTrade(tradeId);
    setIsAddingTrade(false);
    setNewTradeName("");
  };

  const handleAddScope = (event: FormEvent<HTMLFormElement>, tradeId: string) => {
    event.preventDefault();
    if (!project) {
      return;
    }

    const trimmedName = newScopeName.trim();
    if (!trimmedName) {
      return;
    }

    let scopeId = "";
    setProjects((currentProjects) =>
      currentProjects.map((entry) => {
        if (entry.id !== project.id) {
          return entry;
        }

        return {
          ...entry,
          subs: entry.subs.map((trade) => {
            if (trade.id !== tradeId) {
              return trade;
            }

            scopeId = createNextId(
              "sc",
              trade.scopes.map((scope) => scope.id)
            );

            return {
              ...trade,
              scopes: [...trade.scopes, { id: scopeId, name: trimmedName, punchItems: [] }],
            };
          }),
        };
      })
    );

    setExpandedTrade(tradeId);
    setExpandedScope(scopeId);
    setAddingScopeTradeId(null);
    setNewScopeName("");
  };

  const handleAddPunchItem = (
    event: FormEvent<HTMLFormElement>,
    tradeId: string,
    scopeId: string
  ) => {
    event.preventDefault();
    if (!project) {
      return;
    }

    const trimmedDescription = newPunchItem.description.trim();
    if (!trimmedDescription) {
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((entry) =>
        entry.id === project.id
          ? {
              ...entry,
              subs: entry.subs.map((trade) =>
                trade.id === tradeId
                  ? {
                      ...trade,
                      scopes: trade.scopes.map((scope) =>
                        scope.id === scopeId
                          ? {
                              ...scope,
                              punchItems: [
                                {
                                  id: createNextId(
                                    "p",
                                    scope.punchItems.map((item) => item.id)
                                  ),
                                  description: trimmedDescription,
                                  status: newPunchItem.status,
                                  timestamp: new Date().toISOString(),
                                  photos: [],
                                  dueDate: newPunchItem.dueDate || undefined,
                                  assignee: newPunchItem.assignee.trim() || undefined,
                                  priority: newPunchItem.priority,
                                },
                                ...scope.punchItems,
                              ],
                            }
                          : scope
                      ),
                    }
                  : trade
              ),
            }
          : entry
      )
    );

    setAddingPunchScopeKey(null);
    setNewPunchItem(defaultPunchDraft);
  };

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="mb-4 text-slate-400">Project not found</p>
          <Link href="/" className="text-blue-400 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800 shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-slate-400 hover:text-white">
              ← Back
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              <p className="text-sm text-slate-300">{project.address}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[project.status]}`}
            >
              {formatLabel(project.status)}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 shadow">
          <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Trades & Scopes</h2>
            <button
              onClick={() => {
                setIsAddingTrade((current) => !current);
                setNewTradeName("");
              }}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              + Add Trade
            </button>
          </div>

          {isAddingTrade && (
            <form onSubmit={handleAddTrade} className="border-b border-slate-700 px-6 py-4">
              <label htmlFor="trade-name" className="mb-2 block text-sm font-medium text-slate-200">
                Trade Name
              </label>
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  id="trade-name"
                  type="text"
                  required
                  value={newTradeName}
                  onChange={(event) => setNewTradeName(event.target.value)}
                  placeholder="Electrical, Plumbing, HVAC..."
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTrade(false);
                      setNewTradeName("");
                    }}
                    className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                  >
                    Save Trade
                  </button>
                </div>
              </div>
            </form>
          )}

          {project.subs.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">No trades added yet</div>
          ) : (
            <div className="divide-y divide-slate-700">
              {project.subs.map((trade) => (
                <div key={trade.id}>
                  <div
                    className="flex cursor-pointer items-center justify-between px-6 py-4 transition hover:bg-slate-700"
                    onClick={() => setExpandedTrade(expandedTrade === trade.id ? null : trade.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-slate-400">
                        {expandedTrade === trade.id ? "▼" : "▶"}
                      </span>
                      <span className="font-medium text-white">{trade.name}</span>
                      <span className="text-sm text-slate-500">
                        ({trade.scopes.length} scope{trade.scopes.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpandedTrade(trade.id);
                        setAddingScopeTradeId(
                          addingScopeTradeId === trade.id ? null : trade.id
                        );
                        setNewScopeName("");
                      }}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      + Add Scope
                    </button>
                  </div>

                  {expandedTrade === trade.id && (
                    <div>
                      {addingScopeTradeId === trade.id && (
                        <form
                          onSubmit={(event) => handleAddScope(event, trade.id)}
                          className="border-t border-slate-700 bg-slate-900/50 px-6 py-4"
                        >
                          <label
                            htmlFor={`scope-${trade.id}`}
                            className="mb-2 block text-sm font-medium text-slate-200"
                          >
                            Scope Name
                          </label>
                          <div className="flex flex-col gap-2 md:flex-row">
                            <input
                              id={`scope-${trade.id}`}
                              type="text"
                              required
                              value={newScopeName}
                              onChange={(event) => setNewScopeName(event.target.value)}
                              placeholder="Lighting fixtures, Final trim..."
                              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingScopeTradeId(null);
                                  setNewScopeName("");
                                }}
                                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                              >
                                Save Scope
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {trade.scopes.length === 0 ? (
                        <div className="border-t border-slate-700 px-6 py-4 text-sm text-slate-500">
                          No scopes yet
                        </div>
                      ) : (
                        trade.scopes.map((scope) => {
                          const punchKey = `${trade.id}:${scope.id}`;
                          return (
                            <div key={scope.id}>
                              <div
                                className="flex cursor-pointer items-center justify-between border-t border-slate-700 px-6 py-3 transition hover:bg-slate-700"
                                onClick={() =>
                                  setExpandedScope(expandedScope === scope.id ? null : scope.id)
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500">
                                    {expandedScope === scope.id ? "▼" : "▶"}
                                  </span>
                                  <span className="text-slate-200">{scope.name}</span>
                                  <span className="text-sm text-slate-500">
                                    ({scope.punchItems.length} items)
                                  </span>
                                </div>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setExpandedScope(scope.id);
                                    setAddingPunchScopeKey(
                                      addingPunchScopeKey === punchKey ? null : punchKey
                                    );
                                    setNewPunchItem(defaultPunchDraft);
                                  }}
                                  className="text-sm text-blue-400 hover:underline"
                                >
                                  + Add Punch Item
                                </button>
                              </div>

                              {addingPunchScopeKey === punchKey && (
                                <form
                                  onSubmit={(event) => handleAddPunchItem(event, trade.id, scope.id)}
                                  className="space-y-3 border-t border-slate-700 bg-slate-900/60 px-8 py-4"
                                >
                                  <div>
                                    <label
                                      htmlFor={`desc-${punchKey}`}
                                      className="mb-1 block text-sm font-medium text-slate-200"
                                    >
                                      Description
                                    </label>
                                    <textarea
                                      id={`desc-${punchKey}`}
                                      required
                                      value={newPunchItem.description}
                                      onChange={(event) =>
                                        setNewPunchItem((current) => ({
                                          ...current,
                                          description: event.target.value,
                                        }))
                                      }
                                      rows={2}
                                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                      <label
                                        htmlFor={`priority-${punchKey}`}
                                        className="mb-1 block text-sm font-medium text-slate-200"
                                      >
                                        Priority
                                      </label>
                                      <select
                                        id={`priority-${punchKey}`}
                                        value={newPunchItem.priority}
                                        onChange={(event) =>
                                          setNewPunchItem((current) => ({
                                            ...current,
                                            priority: event.target.value as PunchPriority,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                                      >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label
                                        htmlFor={`assignee-${punchKey}`}
                                        className="mb-1 block text-sm font-medium text-slate-200"
                                      >
                                        Assignee
                                      </label>
                                      <input
                                        id={`assignee-${punchKey}`}
                                        type="text"
                                        value={newPunchItem.assignee}
                                        onChange={(event) =>
                                          setNewPunchItem((current) => ({
                                            ...current,
                                            assignee: event.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label
                                        htmlFor={`due-${punchKey}`}
                                        className="mb-1 block text-sm font-medium text-slate-200"
                                      >
                                        Due Date
                                      </label>
                                      <input
                                        id={`due-${punchKey}`}
                                        type="date"
                                        value={newPunchItem.dueDate}
                                        onChange={(event) =>
                                          setNewPunchItem((current) => ({
                                            ...current,
                                            dueDate: event.target.value,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label
                                        htmlFor={`status-${punchKey}`}
                                        className="mb-1 block text-sm font-medium text-slate-200"
                                      >
                                        Status
                                      </label>
                                      <select
                                        id={`status-${punchKey}`}
                                        value={newPunchItem.status}
                                        onChange={(event) =>
                                          setNewPunchItem((current) => ({
                                            ...current,
                                            status: event.target.value as PunchStatus,
                                          }))
                                        }
                                        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                                      >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddingPunchScopeKey(null);
                                        setNewPunchItem(defaultPunchDraft);
                                      }}
                                      className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                                    >
                                      Save Punch Item
                                    </button>
                                  </div>
                                </form>
                              )}

                              {expandedScope === scope.id && (
                                <div className="bg-slate-900/50">
                                  {scope.punchItems.length === 0 ? (
                                    <div className="px-8 py-4 text-sm text-slate-500">
                                      No punch items
                                    </div>
                                  ) : (
                                    scope.punchItems.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-start justify-between border-t border-slate-700 px-8 py-3"
                                      >
                                        <div>
                                          <p className="text-sm font-medium text-slate-200">
                                            {item.description}
                                          </p>
                                          <p className="mt-1 text-xs text-slate-500">
                                            {formatTimestamp(item.timestamp)}
                                          </p>
                                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            <span
                                              className={`rounded-full px-2 py-1 font-medium ${priorityColors[item.priority]}`}
                                            >
                                              {formatLabel(item.priority)}
                                            </span>
                                            {item.assignee && (
                                              <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-1 text-slate-300">
                                                {item.assignee}
                                              </span>
                                            )}
                                            {item.dueDate && (
                                              <span
                                                className={`rounded-full border px-2 py-1 ${
                                                  isOverdue(item)
                                                    ? "border-rose-400/40 bg-rose-900/30 text-rose-200"
                                                    : "border-slate-600 bg-slate-800 text-slate-300"
                                                }`}
                                              >
                                                Due {item.dueDate}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span
                                          className={`rounded px-2 py-1 text-xs font-medium ${statusColors[item.status]}`}
                                        >
                                          {formatLabel(item.status)}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
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
