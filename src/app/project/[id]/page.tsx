"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  Project,
  PunchPriority,
  PunchStatus,
  TaskMode,
  TaskStatus,
  formatDate,
  formatDateTime,
  formatLabel,
  isOverdue,
  loadProjects,
  priorityColors,
  punchStatusColors,
  saveProjects,
  statusColors,
  taskStatusColors,
} from "@/lib/projects";

const taskStatusOrder: TaskStatus[] = ["not_started", "in_progress", "blocked", "completed"];
const punchStatusOrder: PunchStatus[] = ["open", "in_progress", "resolved"];

interface TaskDraft {
  title: string;
  mode: TaskMode;
  startDate: string;
  endDate: string;
  dependencyTaskIds: string[];
}

interface PunchDraft {
  title: string;
  priority: PunchPriority;
  status: PunchStatus;
  dueDate: string;
  assignee: string;
}

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [newTradeName, setNewTradeName] = useState("");
  const [isAddingTrade, setIsAddingTrade] = useState(false);

  const [addingTaskTradeId, setAddingTaskTradeId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<TaskDraft>({
    title: "",
    mode: "sequential",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    dependencyTaskIds: [],
  });

  const [addingPunchTaskKey, setAddingPunchTaskKey] = useState<string | null>(null);
  const [newPunch, setNewPunch] = useState<PunchDraft>({
    title: "",
    priority: "medium",
    status: "open",
    dueDate: "",
    assignee: "",
  });

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const project = useMemo(
    () => projects.find((entry) => entry.id === resolvedParams.id),
    [projects, resolvedParams.id]
  );

  const updateProject = (updater: (project: Project) => Project) => {
    if (!project) {
      return;
    }

    setProjects((current) =>
      current.map((entry) => (entry.id === project.id ? updater(entry) : entry))
    );
  };

  const handleAddTrade = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newTradeName.trim();
    if (!name || !project) {
      return;
    }

    updateProject((entry) => ({
      ...entry,
      trades: [...entry.trades, { id: makeId("tr"), name, tasks: [] }],
    }));

    setNewTradeName("");
    setIsAddingTrade(false);
  };

  const handleAddTask = (event: FormEvent<HTMLFormElement>, tradeId: string) => {
    event.preventDefault();
    if (!project) {
      return;
    }

    const title = newTask.title.trim();
    if (!title || !newTask.startDate || !newTask.endDate) {
      return;
    }

    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) =>
        trade.id === tradeId
          ? {
              ...trade,
              tasks: [
                ...trade.tasks,
                {
                  id: makeId("t"),
                  title,
                  mode: newTask.mode,
                  status: "not_started",
                  startDate: newTask.startDate,
                  endDate: newTask.endDate,
                  dependencyTaskIds: newTask.dependencyTaskIds,
                  punchItems: [],
                },
              ],
            }
          : trade
      ),
    }));

    setAddingTaskTradeId(null);
    setNewTask({
      title: "",
      mode: "sequential",
      startDate: project.startDate,
      endDate: project.endDate ?? project.startDate,
      dependencyTaskIds: [],
    });
  };

  const handleAddPunchItem = (event: FormEvent<HTMLFormElement>, tradeId: string, taskId: string) => {
    event.preventDefault();
    if (!project) {
      return;
    }

    const title = newPunch.title.trim();
    if (!title) {
      return;
    }

    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) =>
        trade.id === tradeId
          ? {
              ...trade,
              tasks: trade.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      punchItems: [
                        {
                          id: makeId("p"),
                          title,
                          status: newPunch.status,
                          priority: newPunch.priority,
                          createdAt: new Date().toISOString(),
                          dueDate: newPunch.dueDate || undefined,
                          assignee: newPunch.assignee.trim() || undefined,
                        },
                        ...task.punchItems,
                      ],
                    }
                  : task
              ),
            }
          : trade
      ),
    }));

    setAddingPunchTaskKey(null);
    setNewPunch({ title: "", priority: "medium", status: "open", dueDate: "", assignee: "" });
  };

  const cycleTaskStatus = (tradeId: string, taskId: string) => {
    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) =>
        trade.id === tradeId
          ? {
              ...trade,
              tasks: trade.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      status:
                        taskStatusOrder[
                          (taskStatusOrder.indexOf(task.status) + 1) % taskStatusOrder.length
                        ],
                    }
                  : task
              ),
            }
          : trade
      ),
    }));
  };

  const cyclePunchStatus = (tradeId: string, taskId: string, itemId: string) => {
    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) =>
        trade.id === tradeId
          ? {
              ...trade,
              tasks: trade.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      punchItems: task.punchItems.map((item) =>
                        item.id === itemId
                          ? {
                              ...item,
                              status:
                                punchStatusOrder[
                                  (punchStatusOrder.indexOf(item.status) + 1) % punchStatusOrder.length
                                ],
                            }
                          : item
                      ),
                    }
                  : task
              ),
            }
          : trade
      ),
    }));
  };

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center">
          <p className="mb-3 text-slate-400">Project not found</p>
          <Link href="/" className="text-cyan-300 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalTasks = project.trades.reduce((count, trade) => count + trade.tasks.length, 0);
  const totalPunchItems = project.trades.flatMap((trade) => trade.tasks.flatMap((task) => task.punchItems));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">
              ← Back
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <p className="text-sm text-slate-400">{project.address}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[project.status]}`}>
              {formatLabel(project.status)}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label="Trades" value={project.trades.length.toString()} />
          <SummaryCard label="Tasks" value={totalTasks.toString()} valueClass="text-cyan-300" />
          <SummaryCard
            label="Open Punch"
            value={totalPunchItems.filter((item) => item.status !== "resolved").length.toString()}
            valueClass="text-amber-300"
          />
          <SummaryCard
            label="Overdue"
            value={totalPunchItems.filter((item) => isOverdue(item)).length.toString()}
            valueClass="text-rose-300"
          />
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task Gantt</h2>
            <span className="text-xs text-slate-500">Timeline by task start/end dates</span>
          </div>
          <GanttChart project={project} />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h2 className="text-lg font-semibold">Trades</h2>
            <button
              onClick={() => {
                setIsAddingTrade((current) => !current);
                setNewTradeName("");
              }}
              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              + Add Trade
            </button>
          </header>

          {isAddingTrade && (
            <form onSubmit={handleAddTrade} className="border-b border-slate-800 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  required
                  value={newTradeName}
                  onChange={(event) => setNewTradeName(event.target.value)}
                  placeholder="Electrical, Plumbing, HVAC..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTrade(false);
                      setNewTradeName("");
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
                  >
                    Save Trade
                  </button>
                </div>
              </div>
            </form>
          )}

          {project.trades.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">No trades added yet.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {project.trades.map((trade) => (
                <article key={trade.id} className="bg-slate-800/40 px-4 py-5">
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-800/60 px-4 py-3">
                    <div>
                      <h3 className="font-semibold text-white">{trade.name}</h3>
                      <p className="text-xs text-slate-400">{trade.tasks.length} task(s)</p>
                    </div>
                    <button
                      onClick={() => {
                        setAddingTaskTradeId(addingTaskTradeId === trade.id ? null : trade.id);
                        setNewTask({
                          title: "",
                          mode: "sequential",
                          startDate: project.startDate,
                          endDate: project.endDate ?? project.startDate,
                          dependencyTaskIds: [],
                        });
                      }}
                      className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-sm text-cyan-300 hover:bg-cyan-500/30"
                    >
                      + Add Task
                    </button>
                  </div>

                  {addingTaskTradeId === trade.id && (
                    <form
                      onSubmit={(event) => handleAddTask(event, trade.id)}
                      className="mb-4 space-y-3 rounded-lg border border-slate-800 bg-slate-950/80 p-3"
                    >
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">Task title</label>
                        <input
                          type="text"
                          required
                          value={newTask.title}
                          onChange={(event) =>
                            setNewTask((current) => ({ ...current, title: event.target.value }))
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs text-slate-400">Mode</label>
                          <select
                            value={newTask.mode}
                            onChange={(event) =>
                              setNewTask((current) => ({
                                ...current,
                                mode: event.target.value as TaskMode,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                          >
                            <option value="sequential">Sequential</option>
                            <option value="parallel">Parallel</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-400">Start</label>
                          <input
                            type="date"
                            required
                            value={newTask.startDate}
                            onChange={(event) =>
                              setNewTask((current) => ({ ...current, startDate: event.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-400">End</label>
                          <input
                            type="date"
                            required
                            value={newTask.endDate}
                            onChange={(event) =>
                              setNewTask((current) => ({ ...current, endDate: event.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                          />
                        </div>
                      </div>

                      {trade.tasks.length > 0 && (
                        <div>
                          <p className="mb-1 text-xs text-slate-400">Dependencies</p>
                          <div className="flex flex-wrap gap-2">
                            {trade.tasks.map((task) => {
                              const checked = newTask.dependencyTaskIds.includes(task.id);
                              return (
                                <label
                                  key={task.id}
                                  className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-2 py-1 text-xs"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => {
                                      setNewTask((current) => ({
                                        ...current,
                                        dependencyTaskIds: event.target.checked
                                          ? [...current.dependencyTaskIds, task.id]
                                          : current.dependencyTaskIds.filter((id) => id !== task.id),
                                      }));
                                    }}
                                  />
                                  <span className="text-slate-300">{task.title}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingTaskTradeId(null);
                            setNewTask({
                              title: "",
                              mode: "sequential",
                              startDate: project.startDate,
                              endDate: project.endDate ?? project.startDate,
                              dependencyTaskIds: [],
                            });
                          }}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
                        >
                          Save Task
                        </button>
                      </div>
                    </form>
                  )}

                  {trade.tasks.length === 0 ? (
                    <p className="text-sm text-slate-500">No tasks yet.</p>
                  ) : (
                    <div className="space-y-3 pl-2">
                      {trade.tasks.map((task) => {
                        const key = `${trade.id}:${task.id}`;
                        const dependencies = task.dependencyTaskIds
                          .map((dependencyId) =>
                            trade.tasks.find((candidate) => candidate.id === dependencyId)?.title
                          )
                          .filter((title): title is string => Boolean(title));

                        return (
                          <div key={task.id} className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="font-medium">{task.title}</h4>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatDate(task.startDate)} - {formatDate(task.endDate)} · {formatLabel(task.mode)}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => cycleTaskStatus(trade.id, task.id)}
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${taskStatusColors[task.status]}`}
                                >
                                  {formatLabel(task.status)}
                                </button>
                                <button
                                  onClick={() => {
                                    setAddingPunchTaskKey(addingPunchTaskKey === key ? null : key);
                                    setNewPunch({
                                      title: "",
                                      priority: "medium",
                                      status: "open",
                                      dueDate: "",
                                      assignee: "",
                                    });
                                  }}
                                  className="text-xs text-cyan-300 hover:text-cyan-200"
                                >
                                  + Add Punch Item
                                </button>
                              </div>
                            </div>

                            {dependencies.length > 0 && (
                              <p className="mt-2 text-xs text-slate-400">
                                Depends on: <span className="text-slate-300">{dependencies.join(", ")}</span>
                              </p>
                            )}

                            {addingPunchTaskKey === key && (
                              <form
                                onSubmit={(event) => handleAddPunchItem(event, trade.id, task.id)}
                                className="mt-3 space-y-3 rounded-md border border-slate-800 bg-slate-900 p-3"
                              >
                                <div>
                                  <label className="mb-1 block text-xs text-slate-400">Punch item</label>
                                  <textarea
                                    required
                                    rows={2}
                                    value={newPunch.title}
                                    onChange={(event) =>
                                      setNewPunch((current) => ({ ...current, title: event.target.value }))
                                    }
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                  <SelectField
                                    label="Priority"
                                    value={newPunch.priority}
                                    onChange={(value) =>
                                      setNewPunch((current) => ({ ...current, priority: value as PunchPriority }))
                                    }
                                    options={[
                                      { value: "low", label: "Low" },
                                      { value: "medium", label: "Medium" },
                                      { value: "high", label: "High" },
                                    ]}
                                  />
                                  <SelectField
                                    label="Status"
                                    value={newPunch.status}
                                    onChange={(value) =>
                                      setNewPunch((current) => ({ ...current, status: value as PunchStatus }))
                                    }
                                    options={[
                                      { value: "open", label: "Open" },
                                      { value: "in_progress", label: "In Progress" },
                                      { value: "resolved", label: "Resolved" },
                                    ]}
                                  />
                                  <div>
                                    <label className="mb-1 block text-xs text-slate-400">Due date</label>
                                    <input
                                      type="date"
                                      value={newPunch.dueDate}
                                      onChange={(event) =>
                                        setNewPunch((current) => ({ ...current, dueDate: event.target.value }))
                                      }
                                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs text-slate-400">Assignee</label>
                                    <input
                                      type="text"
                                      value={newPunch.assignee}
                                      onChange={(event) =>
                                        setNewPunch((current) => ({ ...current, assignee: event.target.value }))
                                      }
                                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAddingPunchTaskKey(null)}
                                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
                                  >
                                    Save Punch Item
                                  </button>
                                </div>
                              </form>
                            )}

                            {task.punchItems.length > 0 && (
                              <div className="mt-4 space-y-2 pl-3 border-l-2 border-slate-700">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Punch Items</p>
                                {task.punchItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-md border border-slate-600/50 bg-slate-800/40 px-4 py-3"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm text-slate-200">{item.title}</p>
                                        <p className="text-xs text-slate-500">
                                          Created {formatDateTime(item.createdAt)}
                                          {item.assignee ? ` · ${item.assignee}` : ""}
                                        </p>
                                        {item.dueDate && (
                                          <p
                                            className={`text-xs ${
                                              isOverdue(item) ? "text-rose-300" : "text-slate-400"
                                            }`}
                                          >
                                            Due {formatDate(item.dueDate)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[item.priority]}`}
                                        >
                                          {formatLabel(item.priority)}
                                        </span>
                                        <button
                                          onClick={() => cyclePunchStatus(trade.id, task.id, item.id)}
                                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${punchStatusColors[item.status]}`}
                                        >
                                          {formatLabel(item.status)}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${valueClass ?? "text-slate-100"}`}>{value}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400/80 transition focus:ring-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function GanttChart({ project }: { project: Project }) {
  const rows = project.trades.flatMap((trade) =>
    trade.tasks.map((task) => ({
      id: task.id,
      tradeName: trade.name,
      title: task.title,
      startDate: task.startDate,
      endDate: task.endDate,
      mode: task.mode,
      status: task.status,
      lastMessage: task.lastMessage,
      lastMessageFrom: task.lastMessageFrom,
      lastMessageAt: task.lastMessageAt,
    }))
  );

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">Add tasks to generate the timeline.</p>;
  }

  const toDate = (value: string) => new Date(`${value}T00:00:00`);
  const allStarts = rows.map((row) => toDate(row.startDate));
  const allEnds = rows.map((row) => toDate(row.endDate));
  const minDate = new Date(Math.min(...allStarts.map((date) => date.getTime())));
  const maxDate = new Date(Math.max(...allEnds.map((date) => date.getTime())));

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / msPerDay) + 1);
  const dayWidth = 20;
  const timelineWidth = Math.max(540, totalDays * dayWidth);

  const dayLabels = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(minDate.getTime() + index * msPerDay);
    return {
      index,
      short: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      show: index % 7 === 0 || index === 0 || index === totalDays - 1,
    };
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full" style={{ width: `${timelineWidth + 220}px` }}>
        <div className="mb-2 flex border-b border-slate-800 pb-2">
          <div className="w-[220px] shrink-0 text-xs uppercase tracking-wide text-slate-500">Task</div>
          <div className="relative" style={{ width: `${timelineWidth}px` }}>
            {dayLabels.map((label) => (
              <div
                key={label.index}
                className="absolute top-0 text-[10px] text-slate-500"
                style={{ left: `${label.index * dayWidth}px` }}
              >
                {label.show ? label.short : ""}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {rows.map((row) => {
            const startOffset = Math.floor((toDate(row.startDate).getTime() - minDate.getTime()) / msPerDay);
            const duration =
              Math.max(1, Math.floor((toDate(row.endDate).getTime() - toDate(row.startDate).getTime()) / msPerDay) + 1) *
              dayWidth;

            return (
              <div key={row.id} className="flex items-center group">
                <div className="w-[220px] shrink-0 pr-3">
                  <p className="truncate text-sm text-slate-200">{row.title}</p>
                  <p className="text-xs text-slate-500">
                    {row.tradeName} · {formatLabel(row.mode)}
                  </p>
                </div>
                <div className="relative h-8 rounded-md bg-slate-900/70" style={{ width: `${timelineWidth}px` }}>
                  <div
                    className="absolute top-1.5 h-5 rounded-md px-2 text-[11px] leading-5 text-slate-950 cursor-pointer transition hover:scale-105 hover:shadow-lg"
                    style={{
                      left: `${startOffset * dayWidth}px`,
                      width: `${duration}px`,
                      background:
                        row.mode === "sequential"
                          ? "linear-gradient(90deg,#38bdf8,#06b6d4)"
                          : "linear-gradient(90deg,#f59e0b,#f97316)",
                      opacity: row.status === "completed" ? 0.6 : 1,
                    }}
                    title={row.lastMessage ? `"${row.lastMessage}"\n\n— ${row.lastMessageFrom}\n${row.lastMessageAt ? new Date(row.lastMessageAt).toLocaleString() : ''}` : `${row.startDate} to ${row.endDate}`}
                  >
                    {formatLabel(row.status)}
                  </div>
                  {/* Hover tooltip */}
                  {row.lastMessage && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-slate-700 bg-slate-900 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl">
                      <p className="text-sm text-white italic">"{row.lastMessage}"</p>
                      <p className="mt-2 text-xs text-cyan-300">{row.lastMessageFrom}</p>
                      <p className="text-xs text-slate-500">{row.lastMessageAt ? new Date(row.lastMessageAt).toLocaleString() : ''}</p>
                      <p className="mt-1 text-[10px] text-slate-600">Source: Telegram message</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
