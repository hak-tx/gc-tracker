"use client";

import { useMemo, useState } from "react";
import { applyProposedAction, loadMessageRecords, MessageRecord } from "@/lib/pmInbox";

const relevanceBadge: Record<MessageRecord["relevance"], string> = {
  schedule_update: "bg-emerald-700 text-emerald-100",
  coordination: "bg-blue-700 text-blue-100",
  needs_review: "bg-amber-700 text-amber-100",
  noise: "bg-slate-700 text-slate-200",
};

export default function PMInboxPanel() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const records = useMemo(() => {
    void refreshKey;
    return loadMessageRecords();
  }, [refreshKey]);

  const actionableCount = records.filter((r) => r.proposedAction.type === "update_task_status" && !r.applied).length;

  const handleApply = (id: string) => {
    const res = applyProposedAction(id);
    setResult(res.message);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">🧠 PM Message Inbox</h3>
          <p className="mt-1 text-sm text-slate-400">
            Every message is logged. High-confidence schedule updates can be applied to tasks.
          </p>
        </div>
        <div className="text-xs text-slate-300">
          {records.length} logged · {actionableCount} actionable
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-lg border border-slate-600 bg-slate-700/50 p-3 text-sm text-slate-200">
          {result}
        </div>
      )}

      <div className="mt-5 space-y-3 max-h-[420px] overflow-auto pr-1">
        {records.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
            No messages logged yet. Send a message through the demo panel or integration pipeline.
          </div>
        ) : (
          records.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${relevanceBadge[rec.relevance]}`}>
                  {rec.relevance.replace("_", " ")}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(rec.timestamp).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">conf {Math.round(rec.confidence * 100)}%</span>
                {rec.applied && <span className="text-xs text-emerald-300">applied</span>}
              </div>

              <p className="mt-2 text-sm text-slate-100 whitespace-pre-wrap">{rec.text}</p>
              <p className="mt-2 text-xs text-slate-400">Reason: {rec.reason}</p>

              {rec.proposedAction.type === "update_task_status" && (
                <div className="mt-2 text-xs text-slate-300">
                  Proposed: {rec.proposedAction.projectId}/{rec.proposedAction.taskId} → {rec.proposedAction.status}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {rec.proposedAction.type === "update_task_status" && !rec.applied && (
                  <button
                    onClick={() => handleApply(rec.id)}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                  >
                    Apply to schedule
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
