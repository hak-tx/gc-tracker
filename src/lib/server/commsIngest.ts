export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type Relevance = "schedule_update" | "coordination" | "noise" | "needs_review";

export interface CommsExtraction {
  companyName?: string;
  taskTitle?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: TaskStatus;
  relevance?: Relevance;
  confidence?: number; // 0..1
  summary?: string;
}

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
  extraction?: CommsExtraction;
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

function parseJsonLoose(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function toStatus(value: unknown): TaskStatus | undefined {
  if (value === "not_started" || value === "in_progress" || value === "completed" || value === "blocked") {
    return value;
  }
  return undefined;
}

function toRelevance(value: unknown): Relevance | undefined {
  if (value === "schedule_update" || value === "coordination" || value === "noise" || value === "needs_review") {
    return value;
  }
  return undefined;
}

function toIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const m = value.match(/^\d{4}-\d{2}-\d{2}$/);
  return m ? value : undefined;
}

async function extractWithLlm(input: {
  text: string;
  receivedAtIso: string;
  recentContext: string[];
}): Promise<CommsExtraction | null> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const apiUrl = process.env.OPENROUTER_API_KEY
    ? (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1") + "/chat/completions"
    : (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1") + "/chat/completions";

  const model = process.env.COMMS_EXTRACT_MODEL || (process.env.OPENROUTER_API_KEY ? "openai/gpt-4o-mini" : "gpt-4o-mini");

  const system = [
    "You extract structured scheduling data from subcontractor construction chat messages.",
    "Return JSON only.",
    "Prioritize natural-language understanding over keyword matching.",
    "Use message time as temporal anchor.",
    "If message says start/restart today, set startDate to that day.",
    "If message says done by next Tue/Fri/etc, set endDate accordingly.",
    "Never invent dates. If uncertain, omit date fields.",
  ].join(" ");

  const user = {
    anchorDateTime: input.receivedAtIso,
    recentMessages: input.recentContext,
    latestMessage: input.text,
    schema: {
      companyName: "string?",
      taskTitle: "string? concise scope like Rough-In, Trenching, Panel Mounting",
      startDate: "YYYY-MM-DD?",
      endDate: "YYYY-MM-DD?",
      status: "not_started|in_progress|completed|blocked?",
      relevance: "schedule_update|coordination|noise|needs_review?",
      confidence: "0..1 number?",
      summary: "short normalized summary?",
    },
  };

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") return null;

  const parsed = parseJsonLoose(raw);
  if (!parsed) return null;

  const extraction: CommsExtraction = {
    companyName: typeof parsed.companyName === "string" ? parsed.companyName.trim() : undefined,
    taskTitle: typeof parsed.taskTitle === "string" ? parsed.taskTitle.trim() : undefined,
    startDate: toIsoDate(parsed.startDate),
    endDate: toIsoDate(parsed.endDate),
    status: toStatus(parsed.status),
    relevance: toRelevance(parsed.relevance),
    confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : undefined,
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : undefined,
  };

  return extraction;
}

export async function appendCommsEvent(input: {
  source: CommsEvent["source"];
  chatId?: number;
  sender: CommsEvent["sender"];
  text: string;
  projectHint?: string;
  taskHint?: string;
}): Promise<CommsEvent> {
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

  const receivedAt = new Date().toISOString();
  const fallback = classifyText(input.text);
  const recentContext = commsStore.events
    .filter((evt) => evt.chatId === input.chatId)
    .slice(0, 5)
    .reverse()
    .map((evt) => evt.text);

  const extraction = await extractWithLlm({
    text: input.text,
    receivedAtIso: receivedAt,
    recentContext,
  });

  const relevance = extraction?.relevance ?? fallback.relevance;
  const confidence = extraction?.confidence ?? fallback.confidence;
  const inferredStatus = extraction?.status ?? fallback.inferredStatus;

  const event: CommsEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: input.source,
    chatId: input.chatId,
    sender: input.sender,
    text: input.text,
    projectHint: input.projectHint,
    taskHint: input.taskHint,
    relevance,
    confidence,
    inferredStatus,
    extraction: extraction ?? undefined,
    receivedAt,
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
