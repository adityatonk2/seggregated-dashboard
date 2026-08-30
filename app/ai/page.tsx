"use client";

import React, { useRef, useState } from "react";
import AgentActivity from "./AgentActivity";

type AgentTraceStep = { tool: string; args: Record<string, unknown>; resultSummary: string };
type AgentResponse = {
  success: boolean;
  answer?: string;
  trace?: AgentTraceStep[];
  meta?: { provider: string; model: string; steps: number };
  error?: string;
};

type Status = "idle" | "running" | "done" | "error";

const EXAMPLE_PROMPT = "Find our best ICP for AI Automation Sprint.";

export default function AiWorkspacePage() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressTimer = useRef<NodeJS.Timeout | null>(null);

  const runAgent = async () => {
    if (!prompt.trim() || status === "running") return;

    setStatus("running");
    setResult(null);
    setError(null);
    setActiveStep(0);

    // Cosmetic progress: this is a single blocking request, not real
    // streaming, so we advance the checklist on a timer purely for feedback.
    progressTimer.current = setInterval(() => {
      setActiveStep((s) => (s < 2 ? s + 1 : s));
    }, 900);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json: AgentResponse = await res.json();

      if (progressTimer.current) clearInterval(progressTimer.current);
      setActiveStep(3);

      if (!json.success) {
        setError(json.error || "The agent failed to complete the request.");
        setStatus("error");
        return;
      }

      setResult(json);
      setStatus("done");
    } catch {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setError("Request failed. Is the app server running?");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setActiveStep(-1);
  };

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🥭 Agent Agar</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">AI Sales Intelligence</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <label htmlFor="ai-prompt" className="block text-sm font-semibold text-gray-700">
          What are you looking for?
        </label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={EXAMPLE_PROMPT}
          rows={3}
          disabled={status === "running"}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
        />
        <div className="flex flex-wrap justify-end gap-3">
          {status !== "idle" && (
            <button
              onClick={reset}
              disabled={status === "running"}
              className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200 text-sm font-medium disabled:opacity-50 flex-1 sm:flex-none"
            >
              Reset
            </button>
          )}
          <button
            onClick={runAgent}
            disabled={!prompt.trim() || status === "running"}
            className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
          >
            {status === "running" ? "Running..." : "Run Agent"}
          </button>
        </div>
      </div>

      {status !== "idle" && (
        <div className="mt-6 space-y-4">
          <AgentActivity activeStep={activeStep} />

          {status === "error" && (
            <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 p-4 text-sm">{error}</div>
          )}

          {status === "done" && result && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <p className="text-gray-800 whitespace-pre-wrap break-words">{result.answer}</p>

              {result.trace && result.trace.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-purple-700 font-medium">What the agent did</summary>
                  <ul className="mt-2 space-y-1">
                    {result.trace.map((step, idx) => (
                      <li key={idx} className="text-gray-600 break-words">
                        ✓ Called <span className="font-mono text-gray-800">{step.tool}</span>
                        {Object.keys(step.args).length > 0 && (
                          <span className="font-mono text-gray-500 break-all"> {JSON.stringify(step.args)}</span>
                        )}{" "}
                        → {step.resultSummary}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {result.meta && (
                <p className="text-xs text-gray-400">
                  {result.meta.provider} / {result.meta.model} · {result.meta.steps} step(s)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
