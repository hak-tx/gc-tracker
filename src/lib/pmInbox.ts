import { updateTaskStatus } from "@/lib/telegram";

export type MessageDirection = "inbound" | "outbound";
export type Relevance = "schedule_update" | "coordination" | "noise" | "needs_review";

export interface ProposedAction {
  type: "update_task_status" | "none";
  projectId?: string;
  taskId?: string;
  status?: "not_started" | "in_progress" | "completed" | "blocked";
  note?: string;
}

export interface MessageRecord {
  id: string;
  channel: "telegram" | "manual";
  direction: MessageDirection;
  chatId?: number;
  sender?: string;
  text: string;
  timestamp: string;
  relevance: Relevance;
  reason: string;
  confidence: number;
  proposedAction: ProposedAction;
  applied: boolean;
}

const PM_INBOX_KEY = "gc-tracker-pm-inbox-v1";

export function loadMessageRecords(): MessageRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PM_INBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MessageRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessageRecords(records: MessageRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PM_INBOX_KEY, JSON.stringify(records));
}

function inferStatus(text: string): ProposedAction["status"] | undefined {
  const t = text.toLowerCase();
  if (/\b(done|finished|complete|completed)\b/.test(t)) return "completed";
  if (/\b(started|starting|working|in progress|on it)\b/.test(t)) return "in_progress";
  if (/\b(blocked|waiting|stuck|delay|delayed)\b/.test(t)) return "blocked";
  if (/\b(not started|pending)\b/.test(t)) return "not_started";
  return undefined;
}

function parseUpdateCommand(text: string) {
  const match = text.match(/^\/update\s+(\d+)\s+(\S+)\s+(\S+)\s*(.*)$/i);
  if (!match) return null;
  return {
    projectId: match[1],
    taskId: match[2],
    rawStatus: match[3].toLowerCase(),
    note: match[4] || "",
  };
}

export function classifyMessage(text: string): Pick<MessageRecord, "relevance" | "reason" | "confidence" | "proposedAction"> {
  const command = parseUpdateCommand(text.trim());
  if (command) {
    const normalized = inferStatus(command.rawStatus) || (command.rawStatus === "completed" ? "completed" : undefined);
    return {
      relevance: normalized ? "schedule_update" : "needs_review",
      reason: normalized
        ? "Structured update command includes project/task/status."
        : "Structured command found but status is not recognized.",
      confidence: normalized ? 0.98 : 0.55,
      proposedAction: normalized
        ? {
            type: "update_task_status",
            projectId: command.projectId,
            taskId: command.taskId,
            status: normalized,
            note: command.note,
          }
        : { type: "none" },
    };
  }

  const status = inferStatus(text);
  if (status) {
    return {
      relevance: "schedule_update",
      reason: "Status language detected but task target is ambiguous.",
      confidence: 0.7,
      proposedAction: { type: "none", note: `Detected status: ${status}` },
    };
  }

  if (/\b(when|where|access|part|permit|inspection|schedule|tomorrow|monday|eta)\b/i.test(text)) {
    return {
      relevance: "coordination",
      reason: "Coordination/logistics language detected.",
      confidence: 0.64,
      proposedAction: { type: "none" },
    };
  }

  return {
    relevance: "noise",
    reason: "No clear scheduling or coordination signal detected.",
    confidence: 0.4,
    proposedAction: { type: "none" },
  };
}

export function logMessage(input: {
  channel?: "telegram" | "manual";
  direction: MessageDirection;
  chatId?: number;
  sender?: string;
  text: string;
}): MessageRecord {
  const analysis = classifyMessage(input.text);
  const record: MessageRecord = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel: input.channel || "telegram",
    direction: input.direction,
    chatId: input.chatId,
    sender: input.sender,
    text: input.text,
    timestamp: new Date().toISOString(),
    relevance: analysis.relevance,
    reason: analysis.reason,
    confidence: analysis.confidence,
    proposedAction: analysis.proposedAction,
    applied: false,
  };

  const existing = loadMessageRecords();
  saveMessageRecords([record, ...existing].slice(0, 500));
  return record;
}

export function applyProposedAction(recordId: string): { ok: boolean; message: string } {
  const records = loadMessageRecords();
  const rec = records.find((r) => r.id === recordId);

  if (!rec) return { ok: false, message: "Record not found." };
  if (rec.applied) return { ok: true, message: "Already applied." };

  if (rec.proposedAction.type !== "update_task_status") {
    return { ok: false, message: "No actionable update on this message." };
  }

  const { projectId, taskId, status, note } = rec.proposedAction;
  if (!projectId || !taskId || !status) {
    return { ok: false, message: "Missing project/task/status for update." };
  }

  const applied = updateTaskStatus(projectId, taskId, status, note || rec.text);
  if (!applied) {
    return { ok: false, message: "Task update failed (project/task not found)." };
  }

  rec.applied = true;
  saveMessageRecords(records);
  return { ok: true, message: `Applied update: ${projectId}/${taskId} → ${status}` };
}
