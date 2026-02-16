/**
 * Telegram Integration Client for FactorGC
 * 
 * This module provides functions to:
 * 1. Sync messages with the Telegram bot via API
 * 2. Store Telegram chat data in localStorage
 * 3. Poll for new messages (for demo/testing)
 */

import { Project, loadProjects, saveProjects, ChatMessage } from "./projects";

const TELEGRAM_STORAGE_KEY = "gc-tracker-telegram";
const TELEGRAM_CHAT_KEY = "gc-tracker-chat-id";

export interface TelegramMessage {
  id: string;
  chatId: number;
  text: string;
  from: "agent" | "sub";
  timestamp: string;
  projectId?: string;
  taskId?: string;
}

export interface TelegramState {
  lastSync: string | null;
  chatId: number | null;
  pendingMessages: TelegramMessage[];
}

// Get stored Telegram state
export function getTelegramState(): TelegramState {
  if (typeof window === "undefined") {
    return { lastSync: null, chatId: null, pendingMessages: [] };
  }
  
  const stored = localStorage.getItem(TELEGRAM_STORAGE_KEY);
  if (!stored) {
    return { lastSync: null, chatId: null, pendingMessages: [] };
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return { lastSync: null, chatId: null, pendingMessages: [] };
  }
}

// Save Telegram state
export function saveTelegramState(state: TelegramState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TELEGRAM_STORAGE_KEY, JSON.stringify(state));
}

// Set the Telegram chat ID (for demo/testing)
export function setTelegramChatId(chatId: number): void {
  const state = getTelegramState();
  state.chatId = chatId;
  saveTelegramState(state);
}

// Send a message to the Telegram bot (via API)
export async function sendToTelegram(text: string): Promise<{ ok: boolean; message?: string }> {
  const state = getTelegramState();
  
  if (!state.chatId) {
    // Demo mode: simulate sending
    console.log("[Telegram Demo] Would send:", text);
    
    // Store locally as pending
    state.pendingMessages.push({
      id: `msg-${Date.now()}`,
      chatId: 0,
      text,
      from: "agent",
      timestamp: new Date().toISOString(),
    });
    saveTelegramState(state);
    
    return { ok: true, message: "Demo: Message stored locally" };
  }
  
  try {
    const response = await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: state.chatId,
        text,
      }),
    });
    
    const data = await response.json();
    return { ok: data.ok, message: data.message };
  } catch (error) {
    console.error("Failed to send to Telegram:", error);
    return { ok: false, message: "Failed to send message" };
  }
}

// Poll for new messages (demo mode)
export async function pollTelegramMessages(): Promise<TelegramMessage[]> {
  const state = getTelegramState();
  
  // In demo mode, return pending messages
  if (state.pendingMessages.length > 0) {
    const messages = [...state.pendingMessages];
    state.pendingMessages = [];
    state.lastSync = new Date().toISOString();
    saveTelegramState(state);
    return messages;
  }
  
  return [];
}

// Add a chat message to a specific task
export function addChatMessageToTask(
  projectId: string,
  taskId: string,
  text: string,
  from: "agent" | "sub"
): boolean {
  const projects = loadProjects();
  
  for (const project of projects) {
    if (project.id !== projectId) continue;
    
    for (const trade of project.trades) {
      const task = trade.tasks.find((t) => t.id === taskId);
      if (!task) continue;
      
      // Add the message
      const chatMessage: ChatMessage = {
        id: `chat-${Date.now()}`,
        from,
        text,
        timestamp: new Date().toISOString(),
      };
      
      task.chatMessages = task.chatMessages || [];
      task.chatMessages.push(chatMessage);
      
      // Update lastMessage fields
      task.lastMessage = text;
      task.lastMessageFrom = from === "agent" ? "FactorGC Agent" : "Subcontractor";
      task.lastMessageAt = chatMessage.timestamp;
      
      saveProjects(projects);
      return true;
    }
  }
  
  return false;
}

// Update task status from Telegram message
export function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: "not_started" | "in_progress" | "completed" | "blocked",
  message?: string
): boolean {
  const projects = loadProjects();
  
  for (const project of projects) {
    if (project.id !== projectId) continue;
    
    for (const trade of project.trades) {
      const task = trade.tasks.find((t) => t.id === taskId);
      if (!task) continue;
      
      task.status = status;
      
      if (message) {
        task.lastMessage = message;
        task.lastMessageFrom = "Subcontractor";
        task.lastMessageAt = new Date().toISOString();
        
        // Also add to chat
        const chatMessage: ChatMessage = {
          id: `chat-${Date.now()}`,
          from: "sub",
          text: message,
          timestamp: new Date().toISOString(),
        };
        task.chatMessages = task.chatMessages || [];
        task.chatMessages.push(chatMessage);
      }
      
      saveProjects(projects);
      return true;
    }
  }
  
  return false;
}

// Get all Telegram-related messages
export function getAllTelegramMessages(): TelegramMessage[] {
  const state = getTelegramState();
  return state.pendingMessages;
}
