import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";

export default function PredictionChart({ forecast, note }) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">AI Forecast</p>
        <p className="text-sm text-gray-500">{note || "Building your forecast — check back after a couple of dashboard visits."}</p>
      </div>
    );
  }

  const method = forecast[0]?.method === "ml" ? "ML model (RandomForest)" : "Trend estimate (cold start)";

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">AI-predicted AQI — next {forecast.length} days</p>
        <span className="text-[11px] text-gray-400">{method}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={forecast} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 500]} />
          <ReferenceLine y={100} stroke="#A0C93D" strokeDasharray="4 4" />
          <ReferenceLine y={200} stroke="#F4C542" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value, name, props) => [`AQI ${value} (${props.payload.category})`, "Predicted"]}
          />
          <Line type="monotone" dataKey="predicted_aqi" stroke="#14213D" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2">
        {forecast.map((f) => (
          <span key={f.date} className="text-[11px] px-2 py-1 rounded-full" style={{ background: `${f.color}22`, color: f.color }}>
            {f.date.slice(5)}: {f.category}
          </span>
        ))}
      </div>
    </div>
  );
}
