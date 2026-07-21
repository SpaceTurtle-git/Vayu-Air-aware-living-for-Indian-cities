import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Popular Indian cities as one-tap presets — the request specifically calls
// out Mumbai/Delhi, so those lead, but any lat/lng works (custom entry below).
const PRESET_CITIES = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
];

const HEALTH_OPTIONS = [
  { value: "general", label: "No specific condition" },
  { value: "asthma", label: "Asthma / respiratory condition" },
  { value: "heart", label: "Cardiovascular condition" },
  { value: "athlete", label: "Fitness enthusiast / runner" },
  { value: "child_elderly", label: "Child or elderly at home" },
];

export default function LocationSetup() {
  const { updateProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(PRESET_CITIES[0]);
  const [custom, setCustom] = useState({ city: "", lat: "", lng: "" });
  const [useCustom, setUseCustom] = useState(false);
  const [health, setHealth] = useState("general");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const payload = useCustom
        ? { city_name: custom.city, latitude: parseFloat(custom.lat), longitude: parseFloat(custom.lng), health_profile: health }
        : { city_name: selected.name, latitude: selected.lat, longitude: selected.lng, health_profile: health };
      if (Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
        throw new Error("invalid coords");
      }
      await updateProfile(payload);
      navigate("/");
    } catch {
      setError("Please provide a valid city and coordinates.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-8">
        <h1 className="font-display font-700 text-2xl text-dusk">Where are you?</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">
          We'll use this for your dashboard, forecasts, and daily email. You can add more locations later.
        </p>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-dusk2">Pick a city</span>
              <button type="button" onClick={() => setUseCustom(!useCustom)} className="text-xs text-dusk2 underline">
                {useCustom ? "Choose from list instead" : "Enter custom coordinates"}
              </button>
            </div>

            {!useCustom ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_CITIES.map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    onClick={() => setSelected(c)}
                    className={`px-3 py-2 rounded-lg text-sm border transition ${
                      selected.name === c.name ? "bg-dusk2 text-white border-dusk2" : "border-gray-200 text-gray-700 hover:border-dusk2"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input placeholder="City name" className="px-3 py-2 rounded-lg border border-gray-200 sm:col-span-1"
                  value={custom.city} onChange={(e) => setCustom({ ...custom, city: e.target.value })} />
                <input placeholder="Latitude" className="px-3 py-2 rounded-lg border border-gray-200"
                  value={custom.lat} onChange={(e) => setCustom({ ...custom, lat: e.target.value })} />
                <input placeholder="Longitude" className="px-3 py-2 rounded-lg border border-gray-200"
                  value={custom.lng} onChange={(e) => setCustom({ ...custom, lng: e.target.value })} />
              </div>
            )}
          </div>

          <div>
            <span className="text-sm font-medium text-dusk2 block mb-2">Any health context we should factor in?</span>
            <div className="space-y-2">
              {HEALTH_OPTIONS.map((h) => (
                <label key={h.value} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" name="health" checked={health === h.value} onChange={() => setHealth(h.value)} />
                  {h.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-verypoor text-sm">{error}</p>}

          <button disabled={busy} className="w-full bg-dusk2 text-white py-2.5 rounded-lg font-medium hover:bg-dusk transition disabled:opacity-60">
            {busy ? "Saving…" : "Continue to dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
