import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const HEALTH_OPTIONS = [
  { value: "general", label: "No specific condition" },
  { value: "asthma", label: "Asthma / respiratory condition" },
  { value: "heart", label: "Cardiovascular condition" },
  { value: "athlete", label: "Fitness enthusiast / runner" },
  { value: "child_elderly", label: "Child or elderly at home" },
];

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const p = user?.profile;
  const [emailEnabled, setEmailEnabled] = useState(p?.email_enabled ?? true);
  const [hour, setHour] = useState(p?.email_hour ?? 7);
  const [minute, setMinute] = useState(p?.email_minute ?? 0);
  const [health, setHealth] = useState(p?.health_profile ?? "general");
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");
    try {
      await updateProfile({
        email_enabled: emailEnabled, email_hour: Number(hour), email_minute: Number(minute), health_profile: health,
      });
      setMsg("Saved.");
    } catch {
      setMsg("Couldn't save — please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display font-700 text-2xl text-dusk mb-6">Settings</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <p className="text-sm font-medium text-dusk2 mb-3">Daily email report</p>
        <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
          <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
          Send me a morning email with weather, AQI, forecast and my saved routes
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Send at</span>
          <select value={hour} onChange={(e) => setHour(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
            {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}</option>)}
          </select>
          :
          <select value={minute} onChange={(e) => setMinute(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
            {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
          </select>
          <span className="text-sm text-gray-400">IST</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <p className="text-sm font-medium text-dusk2 mb-3">Health context</p>
        <div className="space-y-2">
          {HEALTH_OPTIONS.map((h) => (
            <label key={h.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="health" checked={health === h.value} onChange={() => setHealth(h.value)} />
              {h.label}
            </label>
          ))}
        </div>
      </div>

      <button onClick={save} className="bg-dusk2 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-dusk transition">
        Save settings
      </button>
      {msg && <p className="text-sm text-gray-500 mt-3">{msg}</p>}
    </div>
  );
}
