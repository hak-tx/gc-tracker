"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, use, useEffect, useMemo, useRef, useState } from "react";
import {
  Project,
  PunchItem,
  PunchPriority,
  PunchStatus,
  Task,
  TaskMode,
  TaskStatus,
  ChatMessage,
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

interface TaskEditorDraft {
  tradeName: string;
  title: string;
  mode: TaskMode;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  dependencyTaskIds: string[];
}

interface IngestEvent {
  id: string;
  sender: "sub" | "agent" | "system";
  text: string;
  relevance: "schedule_update" | "coordination" | "noise" | "needs_review";
  confidence: number;
  inferredStatus?: TaskStatus;
  receivedAt: string;
}

const APP_BUILD_TAG = "comms-fix-2026-02-18-1";

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const parseDateReferenceFromText = (text: string, now = new Date()): string | null => {
  const normalized = text.toLowerCase();

  const numericDate = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numericDate) {
    const month = Number(numericDate[1]);
    const day = Number(numericDate[2]);
    const yearRaw = numericDate[3] ? Number(numericDate[3]) : now.getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
    }
  }

  const weekdayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const weekdayMatch = normalized.match(/\b(?:(this|next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch) {
    const qualifier = weekdayMatch[1];
    const weekday = weekdayMap[weekdayMatch[2]];
    const current = now.getDay();
    let offset = (weekday - current + 7) % 7;

    if (qualifier === "next") {
      offset = offset === 0 ? 7 : offset + 7;
    } else if (qualifier === "this") {
      if (offset === 0) offset = 0;
      if (offset < 0) offset += 7;
    } else if (offset === 0) {
      offset = 7;
    }

    const target = new Date(now);
    target.setDate(now.getDate() + offset);
    return toIsoDate(target);
  }

  if (/\bend of week\b/.test(normalized)) {
    const current = now.getDay();
    const offset = (5 - current + 7) % 7;
    const target = new Date(now);
    target.setDate(now.getDate() + offset);
    return toIsoDate(target);
  }

  if (/\btomorrow\b/.test(normalized)) {
    const target = new Date(now);
    target.setDate(now.getDate() + 1);
    return toIsoDate(target);
  }

  if (/\btoday\b/.test(normalized)) {
    return toIsoDate(now);
  }

  return null;
};

const parseTargetStartDateFromMessage = (text: string, now = new Date()): string | null => {
  const normalized = text.toLowerCase();
  const hasStartCue = /\b(start|started|starting|restart|restarted|resume|resumed|begin|began|kickoff)\b/.test(normalized);
  if (!hasStartCue) return null;

  const explicit = parseDateReferenceFromText(text, now);
  if (explicit) return explicit;

  if (/\b(today|this\s+morning|this\s+afternoon|now)\b/.test(normalized)) {
    return toIsoDate(now);
  }

  return toIsoDate(now);
};

const parseTargetEndDateFromMessage = (text: string, now = new Date()): string | null => {
  return parseDateReferenceFromText(text, now);
};

const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const inferAutoTaskTitle = (text: string): string => {
  const normalized = text.toLowerCase();

  const explicitScope = normalized.match(
    /\b(?:started|starting|restarted|resume(?:d)?|continu(?:e|ing|ed)|working on|install(?:ing|ed)?|mount(?:ing|ed)?|rough[-\s]?in(?:g)?|finish(?:ing|ed)?|complete(?:d|ing)?|update(?:d)?)\s+([a-z0-9][a-z0-9\s\-/&]{2,40})/
  );
  if (explicitScope?.[1]) {
    const scope = explicitScope[1]
      .replace(/\b(today|tomorrow|now|this\s+morning|this\s+afternoon|by\s+next\s+\w+|by\s+\w+)\b/g, "")
      .replace(/[^a-z0-9\s\-/&]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (scope.length >= 3) {
      return titleCase(scope);
    }
  }

  const keywordScopes: Array<{ re: RegExp; title: string }> = [
    { re: /\brough[-\s]?in\b/, title: "Rough-In" },
    { re: /\bpanel(?:s)?\b.*\bmount|\bmount(?:ing)?\s+panel/, title: "Panel Mounting" },
    { re: /\binspection\b/, title: "Inspection" },
    { re: /\bpermit\b/, title: "Permitting" },
    { re: /\bfixture(?:s)?\b/, title: "Fixture Installation" },
    { re: /\bwiring\b|\bwire\b/, title: "Wiring" },
    { re: /\bdrywall\b/, title: "Drywall" },
    { re: /\bpaint(?:ing)?\b/, title: "Painting" },
    { re: /\bfloor(?:ing)?\b/, title: "Flooring" },
  ];

  const matchedScope = keywordScopes.find((entry) => entry.re.test(normalized));
  if (matchedScope) return matchedScope.title;

  if (/\b(schedule|eta|finish|done|complete|started|start|tomorrow|friday|monday|tuesday|wednesday|thursday)\b/.test(normalized)) {
    return "Schedule Update";
  }

  return "Subcontractor Update";
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProjects(loadProjects());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const seenBuild = window.localStorage.getItem("gc-tracker-build-tag");
    if (seenBuild === APP_BUILD_TAG) return;

    window.localStorage.setItem("gc-tracker-build-tag", APP_BUILD_TAG);

    if ("caches" in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }

    window.setTimeout(() => {
      window.location.reload();
    }, 20);
  }, []);
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
  const [taskEditorTarget, setTaskEditorTarget] = useState<{ tradeId: string; taskId: string } | null>(null);
  const [taskEditorDraft, setTaskEditorDraft] = useState<TaskEditorDraft | null>(null);
  const [commsTaskKey, setCommsTaskKey] = useState<string>("");
  const [subIncomingText, setSubIncomingText] = useState("");
  const [agentCheckInText, setAgentCheckInText] = useState("Quick check-in: are you still on track for this task?");
  const [commsResult, setCommsResult] = useState<string | null>(null);
  const [ingestText, setIngestText] = useState("");
  const [ingestEvents, setIngestEvents] = useState<IngestEvent[]>([]);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [showManualControls, setShowManualControls] = useState(false);
  const [autoApplyIngest, setAutoApplyIngest] = useState(true);
  const processedIngestIdsRef = useRef<Set<string>>(new Set());
  const ingestStartedAtRef = useRef<string>(new Date().toISOString());
  const hasBackfilledFromChatRef = useRef(false);
  const [newPunch, setNewPunch] = useState<PunchDraft>({
    title: "",
    priority: "medium",
    status: "open",
    dueDate: "",
    assignee: "",
  });

  useEffect(() => {
    if (!mounted) {
      return;
    }
    saveProjects(projects);
  }, [mounted, projects]);

  const project = useMemo(
    () => projects.find((entry) => entry.id === resolvedParams.id),
    [projects, resolvedParams.id]
  );

  useEffect(() => {
    if (!project || commsTaskKey || project.trades.length === 0) {
      return;
    }

    const firstTask = project.trades.find((trade) => trade.tasks.length > 0)?.tasks[0];
    const firstTrade = project.trades.find((trade) => trade.tasks.length > 0);
    if (firstTask && firstTrade) {
      setCommsTaskKey(`${firstTrade.id}:${firstTask.id}`);
    }
  }, [project, commsTaskKey]);

  useEffect(() => {
    if (project?.id !== "2") return;

    void loadIngestEvents();
    const interval = window.setInterval(() => {
      void loadIngestEvents();
    }, 12000);

    return () => window.clearInterval(interval);
  }, [project?.id, commsTaskKey]);

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

  const deleteTask = (tradeId: string, taskId: string, taskTitle: string) => {
    const confirmed = window.confirm(`Delete task "${taskTitle}" and all its chat + punch items?`);
    if (!confirmed) return;

    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) =>
        trade.id === tradeId
          ? {
              ...trade,
              tasks: trade.tasks.filter((task) => task.id !== taskId),
            }
          : trade
      ),
    }));

    if (addingPunchTaskKey === `${tradeId}:${taskId}`) {
      setAddingPunchTaskKey(null);
    }
    if (commsTaskKey === `${tradeId}:${taskId}`) {
      setCommsTaskKey("");
    }
    if (taskEditorTarget?.tradeId === tradeId && taskEditorTarget?.taskId === taskId) {
      setTaskEditorTarget(null);
      setTaskEditorDraft(null);
    }
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

  const renameTrade = (tradeId: string, currentName: string) => {
    const nextName = window.prompt("Rename trade", currentName)?.trim();
    if (!nextName || nextName === currentName) return;

    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) => (trade.id === tradeId ? { ...trade, name: nextName } : trade)),
    }));
  };

  const editTaskFull = (tradeId: string, taskId: string, task: Task, tradeTasks: Task[]) => {
    const title = window.prompt("Task / scope title", task.title)?.trim();
    if (!title) return;

    const modeInput =
      window.prompt("Mode (sequential | parallel)", task.mode)?.trim().toLowerCase() || task.mode;
    const mode: TaskMode = modeInput === "parallel" ? "parallel" : "sequential";

    const statusInput =
      window.prompt("Status (not_started | in_progress | blocked | completed)", task.status)
        ?.trim()
        .toLowerCase() || task.status;
    const status: TaskStatus =
      statusInput === "in_progress" ||
      statusInput === "blocked" ||
      statusInput === "completed" ||
      statusInput === "not_started"
        ? statusInput
        : task.status;

    const startDate = window.prompt("Start date (YYYY-MM-DD)", task.startDate)?.trim() || task.startDate;
    const endDate = window.prompt("End date (YYYY-MM-DD)", task.endDate)?.trim() || task.endDate;

    const dependencyHint = tradeTasks
      .filter((candidate) => candidate.id !== task.id)
      .map((candidate) => `${candidate.id}:${candidate.title}`)
      .join(", ");
    const dependencyInput =
      window.prompt(
        `Dependencies by task id (comma separated). Available: ${dependencyHint || "none"}`,
        task.dependencyTaskIds.join(",")
      ) || "";

    const dependencyTaskIds = dependencyInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .filter((id) => id !== task.id && tradeTasks.some((candidate) => candidate.id === id));

    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) =>
        trade.id === tradeId
          ? {
              ...trade,
              tasks: trade.tasks.map((candidate) =>
                candidate.id === taskId
                  ? { ...candidate, title, mode, status, startDate, endDate, dependencyTaskIds }
                  : candidate
              ),
            }
          : trade
      ),
    }));
  };

  const editPunchItem = (tradeId: string, taskId: string, item: PunchItem) => {
    const title = window.prompt("Punch scope / title", item.title)?.trim();
    if (!title) return;

    const priorityInput =
      window.prompt("Priority (low | medium | high)", item.priority)?.trim().toLowerCase() ||
      item.priority;
    const priority: PunchPriority =
      priorityInput === "low" || priorityInput === "high" || priorityInput === "medium"
        ? priorityInput
        : item.priority;

    const statusInput =
      window.prompt("Status (open | in_progress | resolved)", item.status)?.trim().toLowerCase() ||
      item.status;
    const status: PunchStatus =
      statusInput === "open" || statusInput === "in_progress" || statusInput === "resolved"
        ? statusInput
        : item.status;

    const dueDateRaw = window.prompt("Due date (YYYY-MM-DD, blank to clear)", item.dueDate ?? "")?.trim();
    const assigneeRaw = window.prompt("Assignee (blank to clear)", item.assignee ?? "")?.trim();

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
                      punchItems: task.punchItems.map((candidate) =>
                        candidate.id === item.id
                          ? {
                              ...candidate,
                              title,
                              priority,
                              status,
                              dueDate: dueDateRaw || undefined,
                              assignee: assigneeRaw || undefined,
                            }
                          : candidate
                      ),
                    }
                  : task
              ),
            }
          : trade
      ),
    }));
  };

  const openTaskEditor = (trade: Project["trades"][number], task: Task) => {
    setTaskEditorTarget({ tradeId: trade.id, taskId: task.id });
    setTaskEditorDraft({
      tradeName: trade.name,
      title: task.title,
      mode: task.mode,
      status: task.status,
      startDate: task.startDate,
      endDate: task.endDate,
      dependencyTaskIds: [...task.dependencyTaskIds],
    });
  };

  const saveTaskEditor = () => {
    if (!taskEditorTarget || !taskEditorDraft) return;
    const { tradeId, taskId } = taskEditorTarget;

    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) =>
        trade.id === tradeId
          ? {
              ...trade,
              name: taskEditorDraft.tradeName.trim() || trade.name,
              tasks: trade.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      title: taskEditorDraft.title.trim() || task.title,
                      mode: taskEditorDraft.mode,
                      status: taskEditorDraft.status,
                      startDate: taskEditorDraft.startDate,
                      endDate: taskEditorDraft.endDate,
                      dependencyTaskIds: taskEditorDraft.dependencyTaskIds,
                    }
                  : task
              ),
            }
          : trade
      ),
    }));

    setTaskEditorTarget(null);
    setTaskEditorDraft(null);
  };

  const resetTaskChatFromTop = () => {
    if (!taskEditorTarget || !project) return;

    const { tradeId, taskId } = taskEditorTarget;

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
                      title: "Subcontractor Update",
                      mode: "parallel",
                      status: "in_progress",
                      startDate: task.startDate || entry.startDate,
                      endDate: task.startDate || entry.startDate,
                      dependencyTaskIds: [],
                      lastMessage: undefined,
                      lastMessageFrom: undefined,
                      lastMessageAt: undefined,
                      chatMessages: [],
                    }
                  : task
              ),
            }
          : trade
      ),
    }));

    setCommsResult("Chat cleared and task reset. Send a fresh inbound message to re-extract from scratch.");
  };

  const resetAllProjectComms = async () => {
    ingestStartedAtRef.current = new Date().toISOString();
    processedIngestIdsRef.current.clear();

    try {
      await fetch("/api/comms/ingest", { method: "DELETE" });
      setIngestEvents([]);
    } catch {
      // Non-fatal: local reset still applies.
    }

    updateProject((entry) => ({
      ...entry,
      trades: entry.trades.map((trade) => ({
        ...trade,
        tasks: trade.tasks.map((task) => ({
          ...task,
          title:
            task.title === "Inbound Coordination" || task.title === "Schedule Update"
              ? "Subcontractor Update"
              : task.title,
          mode: task.dependencyTaskIds.length === 0 ? "parallel" : task.mode,
          status: "in_progress",
          endDate: task.startDate || entry.startDate,
          dependencyTaskIds: [],
          lastMessage: undefined,
          lastMessageFrom: undefined,
          lastMessageAt: undefined,
          chatMessages: [],
        })),
      })),
    }));

    setCommsResult("All task chats cleared for this project. Fresh inbound messages only from now on.");
  };

  const inferTaskStatusFromMessage = (text: string): TaskStatus | null => {
    const normalized = text.toLowerCase();
    const hasFutureCommitment =
      /\b(by|before|until|till|tomorrow|next|eod|end of day|end of week|this\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/.test(
        normalized
      );
    const completionSignal = /\b(done|finished|complete|completed)\b/.test(normalized);

    if (completionSignal && !hasFutureCommitment) return "completed";
    if (/\b(started|working|in progress|on it|underway|wrap|wrapping)\b/.test(normalized)) return "in_progress";
    if (completionSignal && hasFutureCommitment) return "in_progress";
    if (/\b(blocked|waiting|delayed|stuck)\b/.test(normalized)) return "blocked";
    if (/\b(not started|pending)\b/.test(normalized)) return "not_started";
    return null;
  };

  const appendTaskMessage = (
    tradeId: string,
    taskId: string,
    from: "agent" | "sub",
    text: string,
    senderLabel: string
  ) => {
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
                      lastMessage: text,
                      lastMessageFrom: senderLabel,
                      lastMessageAt: new Date().toISOString(),
                      chatMessages: [
                        ...(task.chatMessages || []),
                        {
                          id: makeId("chat"),
                          from,
                          text,
                          timestamp: new Date().toISOString(),
                        },
                      ],
                    }
                  : task
              ),
            }
          : trade
      ),
    }));
  };

  const maybeApplyStatusFromText = (tradeId: string, taskId: string, text: string) => {
    const inferred = inferTaskStatusFromMessage(text);
    const inferredStartDate = parseTargetStartDateFromMessage(text);
    const inferredEndDate = parseTargetEndDateFromMessage(text);
    if (!inferred && !inferredStartDate && !inferredEndDate) return;

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
                      status: inferred ?? task.status,
                      startDate: inferredStartDate ?? task.startDate,
                      endDate: inferredEndDate ?? task.endDate,
                    }
                  : task
              ),
            }
          : trade
      ),
    }));
  };

  useEffect(() => {
    if (!project || hasBackfilledFromChatRef.current) return;

    let changed = false;

    updateProject((entry) => {
      const nextTrades = entry.trades.map((trade) => ({
        ...trade,
        tasks: trade.tasks.map((task) => {
          const latestSub = [...(task.chatMessages || [])].reverse().find((msg) => msg.from === "sub");
          if (!latestSub) return task;

          const inferredStatus = inferTaskStatusFromMessage(latestSub.text);
          const messageNow = new Date(latestSub.timestamp);
          const inferredStartDate = parseTargetStartDateFromMessage(latestSub.text, messageNow);
          const inferredEndDate = parseTargetEndDateFromMessage(latestSub.text, messageNow);
          const inferredTitle =
            task.title === "Inbound Coordination" ||
            task.title === "Schedule Update" ||
            task.title === "Subcontractor Update"
              ? inferAutoTaskTitle(latestSub.text)
              : task.title;

          const shouldFlipMode =
            task.mode === "sequential" &&
            task.dependencyTaskIds.length === 0 &&
            (task.title === "Inbound Coordination" || task.title === "Schedule Update" || task.title === "Subcontractor Update");

          const nextTask = {
            ...task,
            title: inferredTitle,
            status: inferredStatus ?? task.status,
            startDate: inferredStartDate ?? task.startDate,
            endDate: inferredEndDate ?? task.endDate,
            mode: shouldFlipMode ? ("parallel" as TaskMode) : task.mode,
          };

          if (
            nextTask.title !== task.title ||
            nextTask.status !== task.status ||
            nextTask.startDate !== task.startDate ||
            nextTask.endDate !== task.endDate ||
            nextTask.mode !== task.mode
          ) {
            changed = true;
          }

          return nextTask;
        }),
      }));

      return changed ? { ...entry, trades: nextTrades } : entry;
    });

    hasBackfilledFromChatRef.current = true;
  }, [project]);

  const generateAgentReply = (subText: string) => {
    const status = inferTaskStatusFromMessage(subText);
    if (status === "completed") return "Great work. Marking this complete and moving to the next dependency.";
    if (status === "in_progress") return "Perfect. Keep me posted if anything threatens the finish date.";
    if (status === "blocked") return "Got it. What's blocking you specifically so I can clear it today?";
    return "Received. Thanks for the update — I logged it in the project record.";
  };

  const extractCompanyName = (text: string): string | null => {
    const cleaned = text.replace(/^\s+|\s+$/g, "");
    if (!cleaned) return null;

    const explicit = cleaned.match(/^([A-Za-z0-9 '&.-]{3,50}?)(?:\s+(?:here|co\.?|company)\b|[:.-])/i);
    if (explicit?.[1]) return explicit[1].trim();

    const tradeWord = cleaned.match(/\b([A-Z][A-Za-z0-9&'.-]*\s+(?:Electrical|Plumbing|HVAC|Drywall|Flooring|Painting|Paint))\b/);
    if (tradeWord?.[1]) return tradeWord[1].trim();

    return null;
  };

  const taskOptions = project
    ? project.trades.flatMap((trade) =>
        trade.tasks.map((task) => ({
          key: `${trade.id}:${task.id}`,
          tradeId: trade.id,
          taskId: task.id,
          label: `${trade.name} — ${task.title}`,
        }))
      )
    : [];

  const simulateSubUpdateFlow = () => {
    if (!commsTaskKey || !subIncomingText.trim()) return;

    const [tradeId, taskId] = commsTaskKey.split(":");
    const subText = subIncomingText.trim();
    appendTaskMessage(tradeId, taskId, "sub", subText, "Subcontractor");
    maybeApplyStatusFromText(tradeId, taskId, subText);

    const agentReply = generateAgentReply(subText);
    appendTaskMessage(tradeId, taskId, "agent", agentReply, "GC Agent");

    setCommsResult("Logged sub update, generated GC Agent response, and synced to task chat/history.");
    setSubIncomingText("");
  };

  const simulateAgentCheckInFlow = () => {
    if (!commsTaskKey || !agentCheckInText.trim()) return;

    const [tradeId, taskId] = commsTaskKey.split(":");
    appendTaskMessage(tradeId, taskId, "agent", agentCheckInText.trim(), "GC Agent");

    const suggestedSubReply = "Started this morning. Should wrap by end of week.";
    appendTaskMessage(tradeId, taskId, "sub", suggestedSubReply, "Subcontractor");
    maybeApplyStatusFromText(tradeId, taskId, suggestedSubReply);

    setCommsResult("Logged GC check-in and subcontractor response. Schedule status updated when relevant.");
  };

  const loadIngestEvents = async () => {
    setIngestLoading(true);
    try {
      const res = await fetch("/api/comms/ingest", { cache: "no-store" });
      const data = await res.json();
      const events: IngestEvent[] = Array.isArray(data?.events) ? data.events : [];
      setIngestEvents(events);

      // Optional demo behavior: auto-apply inbound comms to tasks.
      if (project?.id === "2" && autoApplyIngest) {
        for (const evt of events.slice(0, 50).reverse()) {
          if (processedIngestIdsRef.current.has(evt.id)) continue;
          if (new Date(evt.receivedAt).getTime() < new Date(ingestStartedAtRef.current).getTime()) continue;

          let resolvedKey = "";

          updateProject((entry) => {
            const company = extractCompanyName(evt.text);

            let targetTrade =
              (company && entry.trades.find((t) => t.name.toLowerCase() === company.toLowerCase())) ||
              (company &&
                entry.trades.find((t) => {
                  const tName = t.name.toLowerCase();
                  const cName = company.toLowerCase();
                  return tName.includes(cName) || cName.includes(tName);
                })) ||
              null;

            let nextEntry = entry;

            if (!targetTrade) {
              const tradeId = makeId("tr");
              const taskId = makeId("t");
              const tradeName = company || "GC Agent Sub";
              const taskTitle = inferAutoTaskTitle(evt.text);
              const eventNow = new Date(evt.receivedAt);
              const inferredStartDate = parseTargetStartDateFromMessage(evt.text, eventNow);
              const inferredEndDate = parseTargetEndDateFromMessage(evt.text, eventNow);
              const newTrade = {
                id: tradeId,
                name: tradeName,
                tasks: [
                  {
                    id: taskId,
                    title: taskTitle,
                    mode: "parallel" as TaskMode,
                    status: "in_progress" as TaskStatus,
                    startDate: inferredStartDate ?? toIsoDate(eventNow),
                    endDate: inferredEndDate ?? entry.endDate ?? inferredStartDate ?? toIsoDate(eventNow),
                    dependencyTaskIds: [],
                    punchItems: [],
                    chatMessages: [],
                  },
                ],
              };
              nextEntry = { ...entry, trades: [...entry.trades, newTrade] };
              targetTrade = newTrade;
            }

            let targetTask = targetTrade.tasks[0];
            if (!targetTask) {
              const taskId = makeId("t");
              const eventNow = new Date(evt.receivedAt);
              const inferredStartDate = parseTargetStartDateFromMessage(evt.text, eventNow);
              const inferredEndDate = parseTargetEndDateFromMessage(evt.text, eventNow);
              const injectedTask = {
                id: taskId,
                title: inferAutoTaskTitle(evt.text),
                mode: "parallel" as TaskMode,
                status: "in_progress" as TaskStatus,
                startDate: inferredStartDate ?? toIsoDate(eventNow),
                endDate: inferredEndDate ?? nextEntry.endDate ?? inferredStartDate ?? toIsoDate(eventNow),
                dependencyTaskIds: [],
                punchItems: [],
                chatMessages: [],
              };

              nextEntry = {
                ...nextEntry,
                trades: nextEntry.trades.map((t) =>
                  t.id === targetTrade!.id ? { ...t, tasks: [...t.tasks, injectedTask] } : t
                ),
              };
              targetTask = injectedTask;
            }

            resolvedKey = `${targetTrade.id}:${targetTask.id}`;

            const subMessageId = `ingest-sub-${evt.id}`;
            const agentMessageId = `ingest-agent-${evt.id}`;

            const withSubMessage = {
              ...nextEntry,
              trades: nextEntry.trades.map((trade) =>
                trade.id === targetTrade!.id
                  ? {
                      ...trade,
                      tasks: trade.tasks.map((task) => {
                        if (task.id !== targetTask!.id) return task;

                        const existingMessages = task.chatMessages || [];
                        const alreadyHasSub = existingMessages.some((msg) => msg.id === subMessageId);

                        const inferredTitle =
                          task.title === "Inbound Coordination" ||
                          task.title === "Schedule Update" ||
                          task.title === "Subcontractor Update"
                            ? inferAutoTaskTitle(evt.text)
                            : task.title;

                        return {
                          ...task,
                          title: inferredTitle,
                          lastMessage: evt.text,
                          lastMessageFrom: company || "Subcontractor",
                          lastMessageAt: new Date().toISOString(),
                          chatMessages: alreadyHasSub
                            ? existingMessages
                            : [
                                ...existingMessages,
                                {
                                  id: subMessageId,
                                  from: "sub" as const,
                                  text: evt.text,
                                  timestamp: new Date().toISOString(),
                                },
                              ],
                        };
                      }),
                    }
                  : trade
              ),
            };

            if (evt.relevance === "schedule_update" && evt.confidence >= 0.8 && evt.inferredStatus) {
              const eventNow = new Date(evt.receivedAt);
              const inferredStartDate = parseTargetStartDateFromMessage(evt.text, eventNow);
              const inferredEndDate = parseTargetEndDateFromMessage(evt.text, eventNow);
              return {
                ...withSubMessage,
                trades: withSubMessage.trades.map((trade) =>
                  trade.id === targetTrade!.id
                    ? {
                        ...trade,
                        tasks: trade.tasks.map((task) =>
                          task.id === targetTask!.id
                            ? {
                                ...task,
                                status: evt.inferredStatus!,
                                startDate: inferredStartDate ?? task.startDate,
                                endDate: inferredEndDate ?? task.endDate,
                                chatMessages: (task.chatMessages || []).some((msg) => msg.id === agentMessageId)
                                  ? task.chatMessages || []
                                  : [
                                      ...(task.chatMessages || []),
                                      {
                                        id: agentMessageId,
                                        from: "agent" as const,
                                        text: generateAgentReply(evt.text),
                                        timestamp: new Date().toISOString(),
                                      },
                                    ],
                              }
                            : task
                        ),
                      }
                    : trade
                ),
              };
            }

            return withSubMessage;
          });

          if (resolvedKey) {
            setCommsTaskKey(resolvedKey);
          }

          processedIngestIdsRef.current.add(evt.id);
        }
      }
    } finally {
      setIngestLoading(false);
    }
  };

  const ingestTestMessage = async () => {
    if (!ingestText.trim()) return;
    const payload = {
      sender: "sub",
      text: ingestText.trim(),
      projectHint: project?.id,
      taskHint: commsTaskKey.split(":")[1],
      chatId: -5294880895,
    };

    setIngestLoading(true);
    try {
      await fetch("/api/comms/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIngestText("");
      await loadIngestEvents();
      setCommsResult("Message ingested by backend queue. Review and apply below.");
    } finally {
      setIngestLoading(false);
    }
  };

  const applyIngestEventToTask = (event: IngestEvent) => {
    if (!commsTaskKey) return;
    const [tradeId, taskId] = commsTaskKey.split(":");

    appendTaskMessage(tradeId, taskId, "sub", event.text, "Subcontractor");
    if (event.inferredStatus) {
      maybeApplyStatusFromText(tradeId, taskId, event.text);
    }

    const agentReply = generateAgentReply(event.text);
    appendTaskMessage(tradeId, taskId, "agent", agentReply, "GC Agent");
    setCommsResult("Ingested event applied to task + GC Agent response logged.");
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950" />;
  }

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

  const activeEditorTrade = taskEditorTarget
    ? project.trades.find((trade) => trade.id === taskEditorTarget.tradeId)
    : null;
  const activeEditorTask = activeEditorTrade && taskEditorTarget
    ? activeEditorTrade.tasks.find((task) => task.id === taskEditorTarget.taskId)
    : null;
  const allChats = project.trades.flatMap((trade) =>
    trade.tasks.flatMap((task) =>
      (task.chatMessages || []).map((msg) => ({
        ...msg,
        tradeName: trade.name,
        taskTitle: task.title,
      }))
    )
  );
  const todaysMessages = allChats.filter(
    (msg) => new Date(msg.timestamp).toDateString() === new Date().toDateString()
  ).length;
  const recentComms = [...allChats]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const todaysIngestMessages = ingestEvents.filter(
    (evt) => new Date(evt.receivedAt).toDateString() === new Date().toDateString()
  ).length;
  const displayMsgsToday = Math.max(todaysMessages, todaysIngestMessages);
  const displayLatestSource = recentComms[0]?.from === "sub" ? "Sub" : recentComms[0] ? "Agent" : ingestEvents[0] ? "Sub" : "-";
  const displayRecentEvents = Math.max(recentComms.length, ingestEvents.length);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 backdrop-blur">
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
        <div className="grid grid-cols-4 gap-1 md:gap-2">
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

        {project.id === "2" && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">GC Agent Comms Lab (Project 2 Demo)</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetAllProjectComms}
                  className="rounded-md border border-rose-500/60 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                >
                  Reset all project chats
                </button>
                <span className="text-xs text-slate-500">Use GC Agent Telegram group + quick simulator below</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <SummaryCard label="Msgs Today" value={displayMsgsToday.toString()} valueClass="text-cyan-300" />
              <SummaryCard label="Latest Source" value={displayLatestSource} valueClass="text-emerald-300" />
              <SummaryCard label="Recent Events" value={displayRecentEvents.toString()} valueClass="text-amber-300" />
            </div>

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  Primary flow: <span className="text-cyan-300">GC Agent Telegram group</span> → ingest → schedule update → alert GC if risk.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoApplyIngest((v) => !v)}
                    className={`rounded-md border px-2 py-1 text-xs ${autoApplyIngest ? "border-amber-400 text-amber-300" : "border-emerald-500/60 text-emerald-300"}`}
                  >
                    Auto-apply: {autoApplyIngest ? "ON" : "OFF"}
                  </button>
                  <button
                    onClick={() => setShowManualControls((s) => !s)}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    {showManualControls ? "Hide manual controls" : "Show manual controls"}
                  </button>
                </div>
              </div>
            </div>

            {showManualControls && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Target task</label>
                  <select
                    value={commsTaskKey}
                    onChange={(event) => setCommsTaskKey(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                  >
                    {taskOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-sm font-medium text-white">Backend ingest queue (test input)</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  placeholder="Paste a realistic sub message here, then ingest"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                />
                <button
                  onClick={ingestTestMessage}
                  disabled={ingestLoading || !ingestText.trim()}
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  Ingest
                </button>
                <button
                  onClick={loadIngestEvents}
                  disabled={ingestLoading}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {ingestEvents.slice(0, 4).map((evt) => (
                  <div key={evt.id} className="rounded-md border border-slate-800 px-2 py-1.5">
                    <p className="text-xs text-slate-300">
                      <span className="text-cyan-300">{evt.relevance}</span> · conf {Math.round(evt.confidence * 100)}%
                      {evt.inferredStatus ? ` · status ${evt.inferredStatus}` : ""}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2">{evt.text}</p>
                    <button
                      onClick={() => applyIngestEventToTask(evt)}
                      className="mt-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Apply to selected task
                    </button>
                  </div>
                ))}
                {ingestEvents.length === 0 && <p className="text-xs text-slate-500">No ingested events yet.</p>}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-sm font-medium text-white">Sub update → Agent response</p>
                <textarea
                  rows={3}
                  value={subIncomingText}
                  onChange={(event) => setSubIncomingText(event.target.value)}
                  placeholder="e.g. We can start Wednesday, 3 days total"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSubIncomingText("Started this morning. Should finish by Friday.")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    started template
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubIncomingText("Blocked - waiting on owner-approved fixture spec.")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    blocked template
                  </button>
                </div>
                <button
                  onClick={simulateSubUpdateFlow}
                  className="mt-2 w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
                >
                  Process inbound update
                </button>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-sm font-medium text-white">Agent check-in → Sub reply</p>
                <textarea
                  rows={3}
                  value={agentCheckInText}
                  onChange={(event) => setAgentCheckInText(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                />
                <button
                  onClick={simulateAgentCheckInFlow}
                  className="mt-2 w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                >
                  Send check-in flow
                </button>
              </div>
            </div>
              </div>
            )}

            {commsResult && <p className="mt-3 text-xs text-cyan-300">{commsResult}</p>}

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-sm font-medium text-white">Task-specific comms</p>
              <p className="mt-1 text-xs text-slate-400">
                Click a task bar in the Gantt chart (or its Chat button) to view only that trade&apos;s conversation.
              </p>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task Gantt</h2>
            <p className="text-xs text-slate-500 md:hidden">← Swipe to see timeline →</p>
            <span className="text-xs text-slate-500 hidden md:inline">Timeline by task start/end dates</span>
          </div>
          <GanttChart project={project} onOpenTask={(tradeId, taskId) => {
            const trade = project.trades.find((t) => t.id === tradeId);
            const task = trade?.tasks.find((t) => t.id === taskId);
            if (trade && task) openTaskEditor(trade, task);
          }} />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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
                <article key={trade.id} className="bg-slate-800 px-4 py-5">
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{trade.name}</h3>
                        <button
                          onClick={() => renameTrade(trade.id, trade.name)}
                          className="text-[11px] text-cyan-300 hover:text-cyan-200"
                        >
                          Edit
                        </button>
                      </div>
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
                      className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm text-slate-950 hover:bg-cyan-400"
                    >
                      + Add Task
                    </button>
                  </div>

                  {addingTaskTradeId === trade.id && (
                    <form
                      onSubmit={(event) => handleAddTask(event, trade.id)}
                      className="mb-4 space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-3"
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
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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
                          <div key={task.id} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{task.title}</h4>
                                  <button
                                    onClick={() => openTaskEditor(trade, task)}
                                    className="text-[11px] text-cyan-300 hover:text-cyan-200"
                                  >
                                    Manage
                                  </button>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatDate(task.startDate)} - {formatDate(task.endDate)} · {formatLabel(task.mode)}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openTaskEditor(trade, task)}
                                  className="text-xs bg-cyan-500 text-slate-900 px-3 py-1.5 rounded font-bold hover:bg-cyan-400"
                                >
                                  Manage
                                </button>
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
                                <button
                                  onClick={() => deleteTask(trade.id, task.id, task.title)}
                                  className="text-xs text-rose-300 hover:text-rose-200"
                                >
                                  Delete Task
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
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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
                                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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
                                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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
                                    className="rounded-md border border-slate-600 bg-slate-800 px-4 py-3"
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
                                        <button
                                          onClick={() => editPunchItem(trade.id, task.id, item)}
                                          className="text-[11px] text-cyan-300 hover:text-cyan-200"
                                        >
                                          Manage
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

      {taskEditorTarget && taskEditorDraft && activeEditorTrade && activeEditorTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 md:p-4"
          onClick={() => {
            setTaskEditorTarget(null);
            setTaskEditorDraft(null);
          }}
        >
          <div
            className="h-full w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 md:h-auto md:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div>
                <h3 className="font-semibold text-white text-base md:text-lg">Task Manager</h3>
                <p className="text-xs text-slate-400">One place for trade, scope, dates, dependencies, and chat history</p>
              </div>
              <button
                onClick={() => {
                  setTaskEditorTarget(null);
                  setTaskEditorDraft(null);
                }}
                className="text-slate-400 hover:text-white text-2xl p-2"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 overflow-y-auto p-4 md:grid-cols-2 md:max-h-[70vh]">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Company / Trade</label>
                  <input
                    value={taskEditorDraft.tradeName}
                    onChange={(e) => setTaskEditorDraft((d) => (d ? { ...d, tradeName: e.target.value } : d))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">Task name / scope</label>
                  <input
                    value={taskEditorDraft.title}
                    onChange={(e) => setTaskEditorDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Mode"
                    value={taskEditorDraft.mode}
                    onChange={(value) => setTaskEditorDraft((d) => (d ? { ...d, mode: value as TaskMode } : d))}
                    options={[
                      { value: "sequential", label: "Sequential" },
                      { value: "parallel", label: "Parallel" },
                    ]}
                  />
                  <SelectField
                    label="Status"
                    value={taskEditorDraft.status}
                    onChange={(value) => setTaskEditorDraft((d) => (d ? { ...d, status: value as TaskStatus } : d))}
                    options={[
                      { value: "not_started", label: "Not Started" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "blocked", label: "Blocked" },
                      { value: "completed", label: "Completed" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Start</label>
                    <input
                      type="date"
                      value={taskEditorDraft.startDate}
                      onChange={(e) => setTaskEditorDraft((d) => (d ? { ...d, startDate: e.target.value } : d))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">End</label>
                    <input
                      type="date"
                      value={taskEditorDraft.endDate}
                      onChange={(e) => setTaskEditorDraft((d) => (d ? { ...d, endDate: e.target.value } : d))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs text-slate-400">Dependencies</p>
                  <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2">
                    {activeEditorTrade.tasks
                      .filter((candidate) => candidate.id !== activeEditorTask.id)
                      .map((candidate) => {
                        const checked = taskEditorDraft.dependencyTaskIds.includes(candidate.id);
                        return (
                          <label key={candidate.id} className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setTaskEditorDraft((d) =>
                                  d
                                    ? {
                                        ...d,
                                        dependencyTaskIds: e.target.checked
                                          ? [...d.dependencyTaskIds, candidate.id]
                                          : d.dependencyTaskIds.filter((id) => id !== candidate.id),
                                      }
                                    : d
                                )
                              }
                            />
                            {candidate.title}
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400">Chat history for this company/task</p>
                <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3">
                  {(activeEditorTask.chatMessages || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No messages yet.</p>
                  ) : (
                    (activeEditorTask.chatMessages || []).map((msg) => (
                      <div key={msg.id} className={`flex ${msg.from === "agent" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[92%] rounded-xl px-3 py-2 text-xs ${msg.from === "agent" ? "bg-cyan-500 text-slate-900" : "bg-slate-800 text-slate-100"}`}>
                          <p>{msg.text}</p>
                          <p className={`mt-1 text-[10px] ${msg.from === "agent" ? "text-slate-700" : "text-slate-500"}`}>
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-700 px-4 py-3">
              <button
                onClick={resetTaskChatFromTop}
                className="rounded-lg border border-rose-500/60 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
              >
                Reset chat from top
              </button>
              <button
                onClick={() => deleteTask(activeEditorTrade.id, activeEditorTask.id, activeEditorTask.title)}
                className="rounded-lg border border-rose-500/60 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
              >
                Delete task
              </button>
              <button
                onClick={() => {
                  setTaskEditorTarget(null);
                  setTaskEditorDraft(null);
                }}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveTaskEditor}
                className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

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
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 md:rounded-xl md:px-4 md:py-4">
      <p className="text-[10px] leading-tight text-slate-400 md:text-sm">{label}</p>
      <p className={`mt-1 text-lg font-semibold leading-none md:mt-2 md:text-3xl ${valueClass ?? "text-slate-100"}`}>{value}</p>
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
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
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

function GanttChart({ project, onOpenTask }: { project: Project; onOpenTask: (tradeId: string, taskId: string) => void }) {
  const rows = project.trades.flatMap((trade) =>
    trade.tasks.map((task) => ({
      id: task.id,
      tradeId: trade.id,
      tradeName: trade.name,
      title: task.title,
      startDate: task.startDate,
      endDate: task.endDate,
      mode: task.mode,
      status: task.status,
      lastMessage: task.lastMessage,
      lastMessageFrom: task.lastMessageFrom,
      lastMessageAt: task.lastMessageAt,
      chatMessages: task.chatMessages,
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
  const rowHeight = 40;
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / msPerDay) + 1);
  const dayWidth = 20;
  const timelineWidth = Math.max(540, totalDays * dayWidth);

  const dayLabels = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(minDate.getTime() + index * msPerDay);
    return {
      index,
      short: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      show: index % 5 === 0 || index === 0 || index === totalDays - 1,
    };
  });

  return (
    <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] scroll-smooth">
      <div className="min-w-full bg-slate-900" style={{ width: `${timelineWidth + 128}px` }}>
        <div className="mb-2 flex border-b border-slate-700 pb-2 bg-slate-900">
          <div className="shrink-0 sticky left-0 z-20 bg-slate-950 pr-2 md:pr-3 border-r border-slate-700 w-32 md:w-[200px]">
            <span className="text-xs uppercase tracking-wide text-slate-400">Task</span>
          </div>
          <div className="relative" style={{ width: `${timelineWidth}px` }}>
            {dayLabels.map((label) => (
              <div
                key={label.index}
                className="absolute top-0 text-[10px] font-medium text-slate-300 border-l border-slate-700 pl-1"
                style={{ left: `${label.index * dayWidth}px`, height: "20px" }}
              >
                {label.show ? label.short : ""}
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-800 bg-slate-950">
          {rows.map((row) => {
            const messageCount = row.chatMessages?.length ?? 0;
            const startOffset = Math.floor((toDate(row.startDate).getTime() - minDate.getTime()) / msPerDay);
            const duration =
              Math.max(1, Math.floor((toDate(row.endDate).getTime() - toDate(row.startDate).getTime()) / msPerDay) + 1) *
              dayWidth;

            return (
              <div
                key={`${row.tradeName}-${row.id}`}
                className="flex h-10 cursor-pointer bg-slate-950 hover:bg-slate-900"
                onClick={() => onOpenTask(row.tradeId, row.id)}
              >
                <div className="shrink-0 sticky left-0 z-20 flex h-10 w-32 items-center border-r border-slate-800 bg-slate-950 pr-2 md:w-[200px] md:pr-3">
                  <div className="flex w-full items-center justify-between gap-1">
                    <p className="min-w-0 truncate text-xs md:text-sm text-cyan-300">{row.title}</p>
                    <button
                      type="button"
                      aria-label={`Open chat for ${row.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTask(row.tradeId, row.id);
                      }}
                      className="text-xs bg-cyan-500 text-slate-900 px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold hover:bg-cyan-400"
                    >
                      <span className="hidden md:inline">Chat {messageCount > 0 ? `(${messageCount})` : ""}</span>
                      <span className="md:hidden">💬</span>
                    </button>
                  </div>
                </div>
                <div className="relative bg-slate-950" style={{ width: `${timelineWidth}px`, height: `${rowHeight}px` }}>
                  {/* Vertical grid lines */}
                  {dayLabels.map((label) => (
                    <div
                      key={label.index}
                      className="absolute top-0 bottom-0 border-l border-slate-800"
                      style={{ left: `${label.index * dayWidth}px` }}
                    />
                  ))}
                  <div
                    className="absolute top-1 h-8 rounded-md px-2 text-[11px] font-medium leading-8 text-slate-950 transition hover:scale-105 hover:shadow-lg"
                    style={{
                      left: `${startOffset * dayWidth}px`,
                      width: `${duration}px`,
                      background:
                        row.status === "completed"
                          ? "linear-gradient(90deg,#34d399,#10b981)"
                          : row.status === "in_progress"
                            ? "linear-gradient(90deg,#f59e0b,#d97706)"
                            : "linear-gradient(90deg,#3b82f6,#2563eb)",
                    }}
                    title={`${row.title}\n${row.startDate} → ${row.endDate}\n${row.status}\n${row.mode}\n${row.tradeName}${row.lastMessage ? '\n\nLast: ' + row.lastMessage : ''}`}
                  >
                    {formatLabel(row.status)}
                  </div>
                  {/* Hover tooltip - show for all tasks */}
                  {true && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-slate-700 bg-slate-900 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <span className="text-sm font-bold text-emerald-400">
                          {new Date(row.startDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: '2-digit' })}
                        </span>
                        <span className="text-sm text-slate-500">→</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {new Date(row.endDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${row.status === 'completed' ? 'bg-emerald-600 text-emerald-100' : row.status === 'in_progress' ? 'bg-cyan-600 text-cyan-100' : row.status === 'blocked' ? 'bg-red-600 text-red-100' : 'bg-slate-700 text-slate-300'}`}>
                          {row.status}
                        </span>
                        <span className="text-slate-500">{row.mode}</span>
                      </div>
                      {row.lastMessage ? (
                        <>
                          <p className="text-sm text-white italic">&quot;{row.lastMessage}&quot;</p>
                          <p className="mt-2 text-xs text-cyan-300">{row.lastMessageFrom}</p>
                          <p className="text-xs text-slate-500">{row.lastMessageAt ? new Date(row.lastMessageAt).toLocaleString() : ''}</p>
                          <p className="mt-1 text-[10px] text-slate-600">Source: Telegram message</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">No messages yet</p>
                      )}
                      {row.chatMessages && row.chatMessages.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenTask(row.tradeId, row.id); }}
                          className="mt-3 w-full rounded-lg bg-cyan-500 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400"
                        >
                          {row.status === 'completed' ? 'View Chat & Closeout' : 'View Chat'}
                        </button>
                      )}
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
