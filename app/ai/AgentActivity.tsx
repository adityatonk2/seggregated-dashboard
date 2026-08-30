import React from "react";

const STEPS = ["Understanding request", "Searching lead database", "Analysing results"];

type AgentActivityProps = {
  activeStep: number; // -1 = none started, STEPS.length = all complete
};

const AgentActivity: React.FC<AgentActivityProps> = ({ activeStep }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-sm font-semibold text-gray-700 mb-3">Agent Activity</p>
    <ul className="space-y-2">
      {STEPS.map((label, idx) => {
        const done = idx < activeStep || activeStep >= STEPS.length;
        const active = idx === activeStep && activeStep < STEPS.length;
        return (
          <li key={label} className="flex items-center gap-2 text-sm">
            <span className={done ? "text-green-600" : active ? "text-blue-600" : "text-gray-300"}>
              {done ? "✓" : active ? "…" : "○"}
            </span>
            <span className={done || active ? "text-gray-800" : "text-gray-400"}>{label}</span>
          </li>
        );
      })}
    </ul>
  </div>
);

export default AgentActivity;
