# FactorGC Telegram Integration Framework

## Overview

This document describes the Telegram integration framework for FactorGC (GC Tracker).

## Current Status

**MVP Framework Complete** ✅

## Architecture

### Option A: Telegram Bot Webhooks (Implemented)

The app uses Next.js API routes to handle Telegram webhooks:

- **Endpoint**: `POST /api/telegram`
- **Health Check**: `GET /api/telegram`

### Option B: OpenClaw Gateway (Alternative)

Could use OpenClaw's built-in Telegram integration to forward messages to the web app.

### Option C: Simple Polling (Demo Mode)

For testing without a real Telegram bot, messages are stored in localStorage and processed locally.

## Files Created

```
src/
├── app/
│   └── api/
│       └── telegram/
│           └── route.ts       # Webhook handler for Telegram
├── components/
│   └── TelegramDemo.tsx       # Demo UI for testing
└── lib/
    └── telegram.ts            # Client-side Telegram utilities
```

## Data Model

The app uses localStorage with the following structure:

- **Project** → contains Trades
- **Trade** → contains Tasks
- **Task** → contains PunchItems and ChatMessages

See `src/lib/projects.ts` for full type definitions.

## Telegram Message Format

### Simple Status Updates

```
done           # Mark task as completed
started        # Mark task as in_progress  
blocked        # Mark task as blocked
```

### Structured Command

```
/update [project_id] [task_id] [status] [message]
/update 1 t-3 completed Finished lighting install
```

## Demo Mode

The demo component on `/projects` allows testing without a real Telegram bot:

1. Set a demo Chat ID (optional)
2. Send status messages
3. Messages are parsed and update project data in localStorage

## Production Deployment

To connect a real Telegram bot:

1. **Create a bot** via @BotFather on Telegram
2. **Get the Bot Token**
3. **Set webhook**:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-vercel-app.com/api/telegram
   ```
4. **Authorize chat IDs** by adding them to the `authorizedChats` Set in `route.ts`
5. **Add database** - Replace in-memory store with a database (Vercel KV, PostgreSQL, etc.)

## API Reference

### GET /api/telegram

Returns bot status and configuration.

```json
{
  "status": "ok",
  "service": "FactorGC Telegram Bot",
  "version": "1.0.0",
  "endpoints": {
    "webhook": "POST /api/telegram",
    "health": "GET /api/telegram"
  },
  "demoMode": true
}
```

### POST /api/telegram

Receives Telegram updates (webhook).

**Request Body** (Telegram Update object):
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "John"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "date": 1234567890,
    "text": "done"
  }
}
```

**Response**:
```json
{
  "ok": true,
  "message": "✅ Update received!",
  "parsed": {
    "status": "completed",
    "message": "done"
  }
}
```

## Next Steps

1. Deploy to Vercel
2. Set up Telegram bot with BotFather
3. Configure webhook URL
4. Add persistent storage (Vercel KV recommended)
5. Add authentication/authorization for chat IDs
6. Expand message parsing for more complex updates

## Notes

- Vercel static hosting can handle API routes (serverless functions)
- The app is already configured to deploy as a dynamic Next.js app
- localStorage works for demo but needs database for production
