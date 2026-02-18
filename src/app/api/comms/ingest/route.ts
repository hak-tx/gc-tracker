import { NextRequest, NextResponse } from "next/server";
import { appendCommsEvent, clearCommsEvents, listCommsEvents } from "@/lib/server/commsIngest";

export async function GET() {
  return NextResponse.json({ ok: true, events: listCommsEvents(300) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();
    if (!text) {
      return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 });
    }

    const event = await appendCommsEvent({
      source: "api",
      chatId: body?.chatId ? Number(body.chatId) : undefined,
      sender: body?.sender === "agent" ? "agent" : "sub",
      text,
      projectHint: body?.projectHint ? String(body.projectHint) : undefined,
      taskHint: body?.taskHint ? String(body.taskHint) : undefined,
    });

    return NextResponse.json({ ok: true, event });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }
}

export async function DELETE() {
  clearCommsEvents();
  return NextResponse.json({ ok: true });
}
