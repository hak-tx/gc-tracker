export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type Relevance = "schedule_update" | "coordination" | "noise" | "needs_review";

export interface CommsEvent {
  id: string;
  source: "telegram_webhook" | "api";
  chatId?: number;
  sender: "sub" | "agent" | "system";
  text: string;
  projectHint?: string;
  taskHint?: string;
  relevance: Relevance;
  confidence: number;
  inferredStatus?: TaskStatus;
  receivedAt: string;
}

const commsStore: { events: CommsEvent[] } = {
  events: [],
};

const DEDUPE_WINDOW_MS = 2 * 60 * 1000;

const normalizeText = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();

function hasFutureCommitment(text: string): boolean {
  return /\b(by|before|until|till|tomorrow|next|eod|end of day|end of week|this\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(
    text
  );
}

export function inferStatus(text: string): TaskStatus | undefined {
  const t = text.toLowerCase();
  const completionSignal = /\b(done|finished|complete|completed)\b/.test(t);
  if (completionSignal && !hasFutureCommitment(t)) return "completed";

  if (/\b(started|starting|working|in progress|on it|underway|wrap|wrapping)\b/.test(t)) return "in_progress";
  if (completionSignal && hasFutureCommitment(t)) return "in_progress";

  if (/\b(blocked|waiting|delay|delayed|stuck)\b/.test(t)) return "blocked";
  if (/\b(not started|pending)\b/.test(t)) return "not_started";
  return undefined;
}

export function classifyText(text: string): {
  relevance: Relevance;
  confidence: number;
  inferredStatus?: TaskStatus;
} {
  const status = inferStatus(text);
  if (status) return { relevance: "schedule_update", confidence: 0.85, inferredStatus: status };

  if (/\b(eta|tomorrow|monday|access|permit|inspection|material|crew|change order|delay)\b/i.test(text)) {
    return { relevance: "coordination", confidence: 0.68 };
  }

  if (text.trim().length < 3) {
    return { relevance: "noise", confidence: 0.4 };
  }

  return { relevance: "needs_review", confidence: 0.52 };
}

export function appendCommsEvent(input: {
  source: CommsEvent["source"];
  chatId?: number;
  sender: CommsEvent["sender"];
  text: string;
  projectHint?: string;
  taskHint?: string;
}): CommsEvent {
  const now = Date.now();
  const normalized = normalizeText(input.text);

  const existing = commsStore.events.find((evt) => {
    const ageMs = now - new Date(evt.receivedAt).getTime();
    return (
      ageMs >= 0 &&
      ageMs <= DEDUPE_WINDOW_MS &&
      evt.source === input.source &&
      evt.sender === input.sender &&
      evt.chatId === input.chatId &&
      normalizeText(evt.text) === normalized
    );
  });

  if (existing) {
    return existing;
  }

  const analysis = classifyText(input.text);
  const event: CommsEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: input.source,
    chatId: input.chatId,
    sender: input.sender,
    text: input.text,
    projectHint: input.projectHint,
    taskHint: input.taskHint,
    relevance: analysis.relevance,
    confidence: analysis.confidence,
    inferredStatus: analysis.inferredStatus,
    receivedAt: new Date().toISOString(),
  };

  commsStore.events.unshift(event);
  commsStore.events = commsStore.events.slice(0, 1000);
  return event;
}

export function listCommsEvents(limit = 200): CommsEvent[] {
  return commsStore.events.slice(0, limit);
}

export function clearCommsEvents(): void {
  commsStore.events = [];
}
