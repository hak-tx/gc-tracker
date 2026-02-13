export type ProjectStatus = "active" | "completed" | "on_hold";
export type PunchStatus = "open" | "in_progress" | "resolved";
export type PunchPriority = "low" | "medium" | "high";

export interface PunchItem {
  id: string;
  description: string;
  status: PunchStatus;
  timestamp: string;
  photos: string[];
  dueDate?: string;
  assignee?: string;
  priority: PunchPriority;
}

export interface Scope {
  id: string;
  name: string;
  punchItems: PunchItem[];
}

export interface SubTrade {
  id: string;
  name: string;
  scopes: Scope[];
}

export interface Project {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  startDate: string;
  subs: SubTrade[];
}

export const statusColors = {
  active: "bg-green-600 text-white",
  completed: "bg-blue-600 text-white",
  on_hold: "bg-yellow-500 text-white",
  open: "bg-red-600 text-white",
  in_progress: "bg-orange-500 text-white",
  resolved: "bg-gray-600 text-white",
} as const;

export const priorityColors: Record<PunchPriority, string> = {
  low: "bg-emerald-700/70 text-emerald-200 border border-emerald-500/40",
  medium: "bg-amber-700/60 text-amber-100 border border-amber-400/50",
  high: "bg-rose-700/60 text-rose-100 border border-rose-400/50",
};

export const STORAGE_KEY = "gc-tracker-projects";

export const defaultProjects: Project[] = [
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
                dueDate: "2026-02-16",
                assignee: "Mike - Electric Co.",
                priority: "high",
              },
              {
                id: "p2",
                description: "Replace switch in break room",
                status: "resolved",
                timestamp: "2026-02-08T14:15:00",
                photos: [],
                dueDate: "2026-02-12",
                assignee: "Sara - Electric Co.",
                priority: "medium",
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
                dueDate: "2026-02-15",
                assignee: "Allied Plumbing",
                priority: "medium",
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

export const formatLabel = (value: string) =>
  value.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const isOverdue = (item: PunchItem) => {
  if (!item.dueDate || item.status === "resolved") {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);
  return item.dueDate < today;
};

export const loadProjects = (): Project[] => {
  if (typeof window === "undefined") {
    return defaultProjects;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return defaultProjects;
  }

  try {
    const parsed = JSON.parse(saved) as Project[];
    if (!Array.isArray(parsed)) {
      return defaultProjects;
    }
    return parsed;
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

export const getProjectPunchItems = (project: Project) =>
  project.subs.flatMap((trade) =>
    trade.scopes.flatMap((scope) => scope.punchItems)
  );
