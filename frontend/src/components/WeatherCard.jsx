import React from "react";

export default function WeatherCard({ weather }) {
  if (!weather) return null;
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Current weather</p>
      <div className="flex items-end justify-between">
        <span className="font-mono font-700 text-4xl text-dusk">{Math.round(weather.temp_c)}°C</span>
        <div className="text-right">
          <p className="text-dusk2 font-medium capitalize">{weather.description}</p>
          <p className="text-gray-400 text-sm">Feels like {Math.round(weather.feels_like_c)}°C</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div className="bg-mist rounded-lg px-3 py-2">
          <p className="text-gray-400 text-xs">Humidity</p>
          <p className="font-mono font-600 text-dusk2">{weather.humidity_pct}%</p>
        </div>
        <div className="bg-mist rounded-lg px-3 py-2">
          <p className="text-gray-400 text-xs">Wind</p>
          <p className="font-mono font-600 text-dusk2">{weather.wind_speed_ms} m/s</p>
        </div>
      </div>
    </div>
  );
}
