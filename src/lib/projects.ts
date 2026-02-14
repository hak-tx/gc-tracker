export type ProjectStatus = "active" | "completed" | "on_hold";
export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type TaskMode = "sequential" | "parallel";
export type PunchStatus = "open" | "in_progress" | "resolved";
export type PunchPriority = "low" | "medium" | "high";

export interface PunchItem {
  id: string;
  title: string;
  status: PunchStatus;
  priority: PunchPriority;
  createdAt: string;
  dueDate?: string;
  assignee?: string;
}

export interface Task {
  id: string;
  title: string;
  mode: TaskMode;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  dependencyTaskIds: string[];
  punchItems: PunchItem[];
  lastMessage?: string;
  lastMessageFrom?: string;
  lastMessageAt?: string;
  chatMessages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  from: "agent" | "sub";
  text: string;
  timestamp: string;
}

export interface Trade {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  trades: Trade[];
}

export const STORAGE_KEY = "gc-tracker-projects";
const STORAGE_VERSION = "v10";

export const statusColors: Record<ProjectStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
  completed: "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40",
  on_hold: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40",
};

export const taskStatusColors: Record<TaskStatus, string> = {
  not_started: "bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/40",
  in_progress: "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40",
  completed: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
  blocked: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40",
};

export const punchStatusColors: Record<PunchStatus, string> = {
  open: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40",
  in_progress: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40",
  resolved: "bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/40",
};

export const priorityColors: Record<PunchPriority, string> = {
  low: "bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-500/30",
  medium: "bg-amber-600/20 text-amber-200 ring-1 ring-amber-500/30",
  high: "bg-rose-600/20 text-rose-200 ring-1 ring-rose-500/30",
};

export const defaultProjects: Project[] = [
  {
    id: "1",
    name: "Riverside Office Renovation",
    address: "123 Main St, Austin, TX",
    status: "active",
    startDate: "2026-02-01",
    endDate: "2026-04-15",
    trades: [
      {
        id: "tr-1",
        name: "Electrical",
        tasks: [
          {
            id: "t-1",
            title: "Main panel upgrade",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-01",
            endDate: "2026-02-10",
            dependencyTaskIds: [],
            punchItems: [
              {
                id: "p-1",
                title: "Label all breakers",
                status: "resolved",
                priority: "medium",
                createdAt: "2026-02-08T10:00:00",
                dueDate: "2026-02-10",
                assignee: "Sparkline Electric",
              },
            ],
          },
          {
            id: "t-2",
            title: "Rough-in wiring",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-05",
            endDate: "2026-02-15",
            dependencyTaskIds: [],
            punchItems: [],
          },
          {
            id: "t-3",
            title: "Lighting fixture install",
            mode: "parallel",
            status: "in_progress",
            startDate: "2026-02-16",
            endDate: "2026-02-28",
            dependencyTaskIds: ["t-2"],
            lastMessage: "I'll be there Monday and be done by end of week",
            lastMessageFrom: "Mike T. (Sparkline Electric)",
            lastMessageAt: "2026-02-14T08:30:00",
            chatMessages: [
              { id: "m1", from: "agent", text: "Hi Mike, this is your automated project check-in for the Riverside Office job. Are you ready to start lighting fixture install on Monday, Feb 16?", timestamp: "2026-02-14T07:00:00" },
              { id: "m2", from: "sub", text: "Yes I'll be there monday morning", timestamp: "2026-02-14T08:15:00" },
              { id: "m3", from: "agent", text: "Great! And when do you expect to finish?", timestamp: "2026-02-14T08:16:00" },
              { id: "m4", from: "sub", text: "I'll be there Monday and be done by end of week", timestamp: "2026-02-14T08:30:00" },
            ],
            punchItems: [
              {
                id: "p-2",
                title: "Pendant fixtures at lobby misaligned",
                status: "in_progress",
                priority: "high",
                createdAt: "2026-02-13T11:30:00",
                dueDate: "2026-02-22",
                assignee: "Mike T.",
              },
              {
                id: "p-3",
                title: "Conference room cans need adjusting",
                status: "open",
                priority: "medium",
                createdAt: "2026-02-14T09:00:00",
                dueDate: "2026-02-25",
                assignee: "Sparkline Electric",
              },
            ],
          },
          {
            id: "t-4",
            title: "Final trim and testing",
            mode: "parallel",
            status: "not_started",
            startDate: "2026-02-26",
            endDate: "2026-03-05",
            dependencyTaskIds: ["t-3"],
            punchItems: [],
          },
        ],
      },
      {
        id: "tr-2",
        name: "Plumbing",
        tasks: [
          {
            id: "t-5",
            title: "Water main reroute",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-01",
            endDate: "2026-02-08",
            dependencyTaskIds: [],
            punchItems: [],
          },
          {
            id: "t-6",
            title: "Restroom fixture install",
            mode: "parallel",
            status: "in_progress",
            startDate: "2026-02-09",
            endDate: "2026-02-20",
            dependencyTaskIds: ["t-5"],
            lastMessage: "Waiting on part, should have it tomorrow",
            lastMessageFrom: "Carlos (Allied Plumbing)",
            lastMessageAt: "2026-02-13T14:22:00",
            chatMessages: [
              { id: "m5", from: "agent", text: "Carlos, checking in on restroom fixtures. Any issues?", timestamp: "2026-02-13T09:00:00" },
              { id: "m6", from: "sub", text: "I need a part for the men's room lavatory. Put in order this morning.", timestamp: "2026-02-13T11:30:00" },
              { id: "m7", from: "agent", text: "Got it. When do you expect the part?", timestamp: "2026-02-13T11:31:00" },
              { id: "m8", from: "sub", text: "Waiting on part, should have it tomorrow", timestamp: "2026-02-13T14:22:00" },
            ],
            punchItems: [
              {
                id: "p-4",
                title: "Men's room lavatory leak",
                status: "open",
                priority: "high",
                createdAt: "2026-02-11T09:15:00",
                dueDate: "2026-02-17",
                assignee: "Allied Plumbing",
              },
              {
                id: "p-5",
                title: "Toilet in women's room running",
                status: "in_progress",
                priority: "medium",
                createdAt: "2026-02-12T14:00:00",
                dueDate: "2026-02-19",
                assignee: "Allied Plumbing",
              },
            ],
          },
          {
            id: "t-7",
            title: "Kitchenette rough-in",
            mode: "sequential",
            status: "in_progress",
            startDate: "2026-02-15",
            endDate: "2026-02-22",
            dependencyTaskIds: [],
            lastMessage: "Got the specs. Customer approved the dishwasher submittal. PDF attached.",
            lastMessageFrom: "Carlos (Allied Plumbing)",
            lastMessageAt: "2026-02-14T11:00:00",
            chatMessages: [
              { id: "m9", from: "agent", text: "Carlos, kitchenette rough-in is scheduled to start Feb 15. Are your materials ready?", timestamp: "2026-02-14T07:00:00" },
              { id: "m10", from: "sub", text: "I don't have the dishwasher specs yet. Can't start without them.", timestamp: "2026-02-14T09:30:00" },
              { id: "m11", from: "agent", text: "I'll follow up with the GC. Can you start once we have them?", timestamp: "2026-02-14T09:31:00" },
              { id: "m12", from: "sub", text: "Can't start until I get the dishwasher specs from you", timestamp: "2026-02-14T10:15:00" },
              { id: "m13", from: "agent", text: "Got the specs. Customer approved the dishwasher submittal. PDF attached.", timestamp: "2026-02-14T11:00:00" },
            ],
            punchItems: [
              {
                id: "p-6",
                title: "Waiting on dishwasher specs from GC",
                status: "open",
                priority: "high",
                createdAt: "2026-02-14T10:00:00",
                assignee: "Allied Plumbing",
              },
            ],
          },
        ],
      },
      {
        id: "tr-3",
        name: "HVAC",
        tasks: [
          {
            id: "t-8",
            title: "Ductwork rough-in",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-03",
            endDate: "2026-02-12",
            dependencyTaskIds: [],
            punchItems: [],
          },
          {
            id: "t-9",
            title: "VAV box install",
            mode: "parallel",
            status: "in_progress",
            startDate: "2026-02-13",
            endDate: "2026-02-20",
            dependencyTaskIds: ["t-8"],
            punchItems: [],
          },
          {
            id: "t-10",
            title: "Thermostat programming",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-02-21",
            endDate: "2026-02-25",
            dependencyTaskIds: ["t-9"],
            punchItems: [
              {
                id: "p-7",
                title: "Program thermostats for occupancy schedule",
                status: "open",
                priority: "low",
                createdAt: "2026-02-14T11:00:00",
                dueDate: "2026-02-28",
                assignee: "Cool Air HVAC",
              },
            ],
          },
        ],
      },
      {
        id: "tr-4",
        name: "Drywall",
        tasks: [
          {
            id: "t-11",
            title: "Hang drywall - floors 1-2",
            mode: "sequential",
            status: "in_progress",
            startDate: "2026-02-10",
            endDate: "2026-02-24",
            dependencyTaskIds: [],
            punchItems: [
              {
                id: "p-8",
                title: "Corner bead needed at stairwell",
                status: "open",
                priority: "medium",
                createdAt: "2026-02-13T08:00:00",
                dueDate: "2026-02-20",
                assignee: "Austin Drywall",
              },
            ],
          },
          {
            id: "t-12",
            title: "Tape and mud",
            mode: "parallel",
            status: "not_started",
            startDate: "2026-02-20",
            endDate: "2026-03-03",
            dependencyTaskIds: ["t-11"],
            punchItems: [],
          },
          {
            id: "t-13",
            title: "Sand and finish",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-03-01",
            endDate: "2026-03-10",
            dependencyTaskIds: ["t-12"],
            punchItems: [],
          },
        ],
      },
      {
        id: "tr-5",
        name: "Flooring",
        tasks: [
          {
            id: "t-14",
            title: "Subfloor prep",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-05",
            endDate: "2026-02-08",
            dependencyTaskIds: [],
            punchItems: [],
          },
          {
            id: "t-15",
            title: "LVP installation - floor 1",
            mode: "sequential",
            status: "in_progress",
            startDate: "2026-02-09",
            endDate: "2026-02-18",
            dependencyTaskIds: ["t-14"],
            punchItems: [
              {
                id: "p-9",
                title: "Transition strip needed at hallway",
                status: "in_progress",
                priority: "medium",
                createdAt: "2026-02-14T13:00:00",
                dueDate: "2026-02-19",
                assignee: "TX Flooring",
              },
              {
                id: "p-10",
                title: "Tile chip in break room - replace plank",
                status: "open",
                priority: "high",
                createdAt: "2026-02-14T15:30:00",
                dueDate: "2026-02-17",
                assignee: "TX Flooring",
              },
            ],
          },
          {
            id: "t-16",
            title: "LVP installation - floor 2",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-02-19",
            endDate: "2026-02-28",
            dependencyTaskIds: ["t-15"],
            punchItems: [],
          },
        ],
      },
      {
        id: "tr-6",
        name: "Painting",
        tasks: [
          {
            id: "t-17",
            title: "Prime walls",
            mode: "parallel",
            status: "not_started",
            startDate: "2026-03-05",
            endDate: "2026-03-10",
            dependencyTaskIds: ["t-13"],
            punchItems: [],
          },
          {
            id: "t-18",
            title: "Finish coat - neutral",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-03-11",
            endDate: "2026-03-18",
            dependencyTaskIds: ["t-17"],
            punchItems: [],
          },
          {
            id: "t-19",
            title: "Accent walls - brand colors",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-03-19",
            endDate: "2026-03-25",
            dependencyTaskIds: ["t-18"],
            punchItems: [],
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
    startDate: "2026-02-05",
    endDate: "2026-06-01",
    trades: [],
  },
];

const toIsoDate = (value: unknown, fallback: string) => {
  if (typeof value !== "string" || value.length < 10) {
    return fallback;
  }
  return value.slice(0, 10);
};

const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const normalizePunch = (raw: unknown, index: number): PunchItem => {
  const entry = (raw as Record<string, unknown>) ?? {};
  return {
    id: typeof entry.id === "string" ? entry.id : `p-${index + 1}`,
    title:
      typeof entry.title === "string"
        ? entry.title
        : typeof entry.description === "string"
          ? entry.description
          : `Punch Item ${index + 1}`,
    status:
      entry.status === "in_progress" || entry.status === "resolved" || entry.status === "open"
        ? entry.status
        : "open",
    priority: entry.priority === "low" || entry.priority === "high" ? entry.priority : "medium",
    createdAt:
      typeof entry.createdAt === "string"
        ? entry.createdAt
        : typeof entry.timestamp === "string"
          ? entry.timestamp
          : new Date().toISOString(),
    dueDate: typeof entry.dueDate === "string" ? entry.dueDate.slice(0, 10) : undefined,
    assignee: typeof entry.assignee === "string" ? entry.assignee : undefined,
  };
};

const normalizeTask = (raw: unknown, index: number, projectStartDate: string): Task => {
  const entry = (raw as Record<string, unknown>) ?? {};

  const startDate = toIsoDate(entry.startDate, projectStartDate);
  const endDate = toIsoDate(entry.endDate, startDate);

  return {
    id: typeof entry.id === "string" ? entry.id : `t-${index + 1}`,
    title:
      typeof entry.title === "string"
        ? entry.title
        : typeof entry.description === "string"
          ? entry.description
          : `Task ${index + 1}`,
    mode: entry.mode === "parallel" || entry.type === "parallel" ? "parallel" : "sequential",
    status:
      entry.status === "in_progress" ||
      entry.status === "completed" ||
      entry.status === "blocked" ||
      entry.status === "not_started"
        ? entry.status
        : "not_started",
    startDate,
    endDate,
    dependencyTaskIds: toArray<string>(entry.dependencyTaskIds).filter(
      (dependencyId): dependencyId is string => typeof dependencyId === "string"
    ),
    lastMessage: typeof entry.lastMessage === "string" ? entry.lastMessage : undefined,
    lastMessageFrom: typeof entry.lastMessageFrom === "string" ? entry.lastMessageFrom : undefined,
    lastMessageAt: typeof entry.lastMessageAt === "string" ? entry.lastMessageAt : undefined,
    chatMessages: toArray(entry.chatMessages)
      .map((message, messageIndex) => {
        const messageEntry = (message as Record<string, unknown>) ?? {};
        const from = messageEntry.from;
        if (from !== "agent" && from !== "sub") {
          return null;
        }
        const text = typeof messageEntry.text === "string" ? messageEntry.text : "";
        if (!text.trim()) {
          return null;
        }
        return {
          id:
            typeof messageEntry.id === "string"
              ? messageEntry.id
              : `m-${index + 1}-${messageIndex + 1}`,
          from,
          text,
          timestamp:
            typeof messageEntry.timestamp === "string"
              ? messageEntry.timestamp
              : new Date().toISOString(),
        };
      })
      .filter((message): message is ChatMessage => Boolean(message)),
    punchItems: toArray(entry.punchItems).map(normalizePunch),
  };
};

const migrateTradeTasksFromScopes = (
  scopes: unknown[],
  projectStartDate: string,
  tradeId: string
): Task[] => {
  const tasks: Task[] = [];

  scopes.forEach((scopeRaw, scopeIndex) => {
    const scope = (scopeRaw as Record<string, unknown>) ?? {};
    const scopeName = typeof scope.name === "string" ? scope.name : `Scope ${scopeIndex + 1}`;

    const scopeTasks = toArray(scope.tasks).map((task, taskIndex) =>
      normalizeTask(task, taskIndex, projectStartDate)
    );

    tasks.push(...scopeTasks);

    const scopePunch = toArray(scope.punchItems).map(normalizePunch);
    if (scopePunch.length > 0) {
      tasks.push({
        id: `${tradeId}-scope-${scopeIndex + 1}-punch`,
        title: `${scopeName} Punch List`,
        mode: "parallel",
        status: scopePunch.some((item) => item.status !== "resolved") ? "in_progress" : "completed",
        startDate: projectStartDate,
        endDate: projectStartDate,
        dependencyTaskIds: [],
        punchItems: scopePunch,
      });
    }
  });

  return tasks;
};

const normalizeTrade = (raw: unknown, index: number, projectStartDate: string): Trade => {
  const entry = (raw as Record<string, unknown>) ?? {};
  const id = typeof entry.id === "string" ? entry.id : `tr-${index + 1}`;

  const directTasks = toArray(entry.tasks).map((task, taskIndex) =>
    normalizeTask(task, taskIndex, projectStartDate)
  );

  const scopedTasks = migrateTradeTasksFromScopes(toArray(entry.scopes), projectStartDate, id);

  return {
    id,
    name: typeof entry.name === "string" ? entry.name : `Trade ${index + 1}`,
    tasks: [...directTasks, ...scopedTasks],
  };
};

const normalizeProject = (raw: unknown, index: number): Project => {
  const entry = (raw as Record<string, unknown>) ?? {};
  const startDate = toIsoDate(entry.startDate, new Date().toISOString().slice(0, 10));

  const tradesRaw = entry.trades ?? entry.subs;

  return {
    id: typeof entry.id === "string" ? entry.id : `${index + 1}`,
    name: typeof entry.name === "string" ? entry.name : `Project ${index + 1}`,
    address: typeof entry.address === "string" ? entry.address : "",
    status:
      entry.status === "completed" || entry.status === "on_hold" || entry.status === "active"
        ? entry.status
        : "active",
    startDate,
    endDate: typeof entry.endDate === "string" ? entry.endDate.slice(0, 10) : undefined,
    trades: toArray(tradesRaw).map((trade, tradeIndex) =>
      normalizeTrade(trade, tradeIndex, startDate)
    ),
  };
};

export const formatLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const getProjectPunchItems = (project: Project) =>
  project.trades.flatMap((trade) => trade.tasks.flatMap((task) => task.punchItems));

export const isOverdue = (item: PunchItem) => {
  if (!item.dueDate || item.status === "resolved") {
    return false;
  }

  return item.dueDate < new Date().toISOString().slice(0, 10);
};

export const loadProjects = (): Project[] => {
  if (typeof window === "undefined") {
    return defaultProjects;
  }

  const version = window.localStorage.getItem("gc-tracker-version");
  if (version !== STORAGE_VERSION) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
    window.localStorage.setItem("gc-tracker-version", STORAGE_VERSION);
    return defaultProjects;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return defaultProjects;
  }

  try {
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) {
      return defaultProjects;
    }
    return parsed.map(normalizeProject);
  } catch {
    return defaultProjects;
  }
};

export const saveProjects = (projects: Project[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};
