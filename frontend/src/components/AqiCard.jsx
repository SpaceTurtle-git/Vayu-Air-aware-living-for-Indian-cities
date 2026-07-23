import React from "react";
import AqiHorizon from "./AqiHorizon.jsx";

const POLLUTANT_LABELS = {
  pm2_5: "PM2.5",
  pm10: "PM10",
  no2: "NO₂",
  o3: "O₃",
  so2: "SO₂",
  co: "CO",
};

export default function AqiCard({ aqi, location, healthAdvisory }) {
  if (!aqi) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Air Quality Index
        </p>

        {location && (
          <span className="text-[11px] text-gray-400">
            Location: {location}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <span
          className="font-mono font-700 text-5xl"
          style={{ color: aqi.color }}
        >
          {aqi.aqi}
        </span>

        <span
          className="font-medium text-lg"
          style={{ color: aqi.color }}
        >
          {aqi.category}
        </span>
      </div>

      <AqiHorizon value={aqi.aqi} />

      <p className="text-sm text-gray-600 mt-4 leading-relaxed">
        {healthAdvisory}
      </p>

      {aqi.components && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {Object.entries(aqi.components)
            .filter(([k]) => POLLUTANT_LABELS[k])
            .map(([k, v]) => (
              <div
                key={k}
                className="bg-mist rounded-lg px-2 py-2 text-center"
              >
                <p className="text-[11px] text-gray-400">
                  {POLLUTANT_LABELS[k]}
                </p>
                <p className="font-mono text-sm text-dusk2 font-600">
                  {Math.round(v)}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}