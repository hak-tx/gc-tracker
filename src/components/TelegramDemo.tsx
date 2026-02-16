"use client";

import { useState } from "react";
import {
  sendToTelegram,
  setTelegramChatId,
  pollTelegramMessages,
  addChatMessageToTask,
  updateTaskStatus,
  getTelegramState,
} from "@/lib/telegram";

interface TelegramDemoProps {
  projectId?: string;
}

export default function TelegramDemo({ projectId = "1" }: TelegramDemoProps) {
  const [chatId, setChatId] = useState<string | number>("");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSetChatId = () => {
    if (chatId) {
      setTelegramChatId(Number(chatId));
      setResponse(`✅ Chat ID ${chatId} set for demo`);
    }
  };
  
  const handleSendMessage = async () => {
    if (!message) return;
    
    setLoading(true);
    setResponse("Sending...");
    
    try {
      const result = await sendToTelegram(message);
      setResponse(result.message || "Message sent!");
      
      // Also try to process locally for demo
      const state = getTelegramState();
      const messages = await pollTelegramMessages();
      
      for (const msg of messages) {
        // Simple demo: if message contains "done", mark task complete
        if (msg.text.toLowerCase().includes("done") || 
            msg.text.toLowerCase().includes("finished")) {
          // Try to update a demo task
          const success = updateTaskStatus(projectId, "t-3", "completed", msg.text);
          if (success) {
            setResponse((prev) => `${prev}\n✅ Task t-3 marked as completed!`);
          }
        }
        
        // Add to chat
        addChatMessageToTask(projectId, "t-3", msg.text, "sub");
      }
      
      setMessage("");
    } catch (error) {
      setResponse("Error sending message");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        📱 Telegram Integration Demo
      </h3>
      
      <div className="space-y-4">
        {/* Chat ID Setup */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Demo Chat ID (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="123456789"
              className="flex-1 rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white"
            />
            <button
              onClick={handleSetChatId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
            >
              Set
            </button>
          </div>
        </div>
        
        {/* Message Input */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Send Update Message
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Try: "done", "started", "finished", or /update 1 t-3 completed Done!'
              className="flex-1 rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !message}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-white font-medium"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
        
        {/* Response */}
        {response && (
          <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{response}</p>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setMessage("done")}
            className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
          >
            done
          </button>
          <button
            onClick={() => setMessage("started")}
            className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
          >
            started
          </button>
          <button
            onClick={() => setMessage("blocked - waiting on part")}
            className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
          >
            blocked
          </button>
          <button
            onClick={() => setMessage("/update 1 t-3 completed Finished lighting install")}
            className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
          >
            /update command
          </button>
        </div>
        
        {/* Info */}
        <div className="text-xs text-slate-500 pt-2">
          💡 In production, this would connect to a Telegram bot via webhooks.
          Messages would be parsed and update the project data automatically.
        </div>
      </div>
    </div>
  );
}
