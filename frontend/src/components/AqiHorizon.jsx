import React from "react";

/**
 * Signature visual for Vayu: a horizon bar spanning the Indian AQI scale
 * (0-500, Good -> Severe) with a marker showing where today's reading sits.
 * Used consistently across the dashboard and emails so the AQI scale itself
 * becomes the app's visual identity, not a generic brand color.
 */
export default function AqiHorizon({ value, height = 14 }) {
  const pct = Math.max(0, Math.min(100, (value / 500) * 100));
  return (
    <div className="w-full">
      <div className="relative w-full rounded-full horizon-gradient" style={{ height }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-dusk rounded-full shadow"
          style={{ left: `${pct}%` }}
          title={`AQI ${value}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
        <span>0</span><span>100</span><span>200</span><span>300</span><span>400</span><span>500</span>
      </div>
    </div>
  );
}
