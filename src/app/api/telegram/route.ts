/**
 * Telegram Webhook Handler for FactorGC
 * 
 * This API route receives messages from Telegram and processes them
 * to update project data. Currently serves as a framework for testing.
 * 
 * For production: Use Vercel KV or similar for persistent storage
 * For testing: Logs messages and returns responses
 */

import { NextRequest, NextResponse } from "next/server";
import { appendCommsEvent } from "@/lib/server/commsIngest";

// Types matching the project's data model
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
}

// In-memory store for demo (would use database in production)
const demoStore: {
  authorizedChats: Set<number>;
  projectUpdates: Array<{
    chatId: number;
    message: string;
    timestamp: string;
    parsed?: {
      projectId?: string;
      taskId?: string;
      status?: string;
      message?: string;
    };
  }>;
} = {
  authorizedChats: new Set([123456789]), // Replace with authorized chat IDs
  projectUpdates: [],
};

// Parse message for project/task updates
function parseMessage(text: string): {
  projectId?: string;
  taskId?: string;
  status?: string;
  message?: string;
} {
  const result: ReturnType<typeof parseMessage> = {};
  
  // Simple parsing patterns
  // Format: /update PROJECT_ID TASK_ID STATUS MESSAGE
  // Example: /update 1 t-3 completed Finished lighting
  
  const updateMatch = text.match(/^\/update\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/i);
  if (updateMatch) {
    result.projectId = updateMatch[1];
    result.taskId = updateMatch[2];
    result.status = updateMatch[3];
    result.message = updateMatch[4];
    return result;
  }
  
  // Simple status update: "done", "finished", "complete" for current task
  const simplePatterns = [
    { pattern: /^(done|finished|complete)\s*$/i, status: "completed" },
    { pattern: /^(started|working|begin)\s*$/i, status: "in_progress" },
    { pattern: /^(blocked|waiting)\s*$/i, status: "blocked" },
    { pattern: /^(not started|pending)\s*$/i, status: "not_started" },
  ];
  
  for (const { pattern, status } of simplePatterns) {
    if (pattern.test(text.trim())) {
      result.status = status;
      result.message = text.trim();
      return result;
    }
  }
  
  // Default: treat as a general message
  result.message = text;
  
  return result;
}

// Generate response based on parsed message
function generateResponse(parsed: ReturnType<typeof parseMessage>, fromName: string): string {
  if (parsed.projectId && parsed.taskId && parsed.status) {
    return `✅ Update received!\n\nProject: ${parsed.projectId}\nTask: ${parsed.taskId}\nStatus: ${parsed.status}\n${parsed.message ? `Note: ${parsed.message}` : ""}\n\nThis will update the project dashboard.`;
  }
  
  if (parsed.status) {
    return `📋 Status noted: ${parsed.status}\n\nTo update a specific task, use:\n/update [project_id] [task_id] [status] [message]\n\nExample: /update 1 t-3 completed Finished lighting install`;
  }
  
  // Default help response
  return `👋 Hi ${fromName}! Welcome to FactorGC.\n\nI can help you update project status. Here are some commands:\n\n📝 **Update Task Status:**\n/update [project_id] [task_id] [status] [message]\nExample: /update 1 t-3 completed Finished lighting\n\n📋 **Simple Status:**\n- "done" - Mark task complete\n- "started" - Mark task in progress\n- "blocked" - Mark task as blocked\n\n💬 Just send me an update and I'll record it!`;
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "FactorGC Telegram Bot",
    version: "1.0.0",
    endpoints: {
      webhook: "POST /api/telegram",
      health: "GET /api/telegram",
    },
    demoMode: true,
    authorizedChats: demoStore.authorizedChats.size,
  });
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    const body: TelegramUpdate = await request.json();
    
    // Validate incoming update
    if (!body.message || !body.message.text || !body.message.from) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    
    const { message } = body;
    const chatId = message.chat.id;
    const text = message.text || "";
    const fromName = message.from.first_name || "there";
    
    console.log(`📨 Message from ${fromName} (${chatId}): ${text}`);
    
    // Check if chat is authorized (demo mode: allow all)
    // In production: if (!demoStore.authorizedChats.has(chatId)) { ... }
    
    // Parse the message
    const parsed = parseMessage(text);
    
    // Store the update
    demoStore.projectUpdates.push({
      chatId,
      message: text,
      timestamp: new Date().toISOString(),
      parsed,
    });

    // Bridge inbound Telegram message into backend comms ingest queue
    await appendCommsEvent({
      source: "telegram_webhook",
      chatId,
      sender: "sub",
      text,
      projectHint: parsed.projectId,
      taskHint: parsed.taskId,
    });
    
    // Generate and return response
    const response = generateResponse(parsed, fromName);
    
    // In production, would send back via Telegram API:
    // await sendTelegramMessage(chatId, response);
    
    return NextResponse.json({
      ok: true,
      message: response,
      parsed,
    });
    
  } catch (error) {
    console.error("❌ Error processing Telegram update:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
