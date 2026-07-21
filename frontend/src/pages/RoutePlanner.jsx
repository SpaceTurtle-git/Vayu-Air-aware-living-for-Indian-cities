import React, { useState } from "react";
import client from "../api/client";
import RouteMap from "../components/RouteMap.jsx";
import PointPickerMap from "../components/PointPickerMap.jsx";

// A few well-known landmarks for quick testing in the two cities called out
// in the brief. Users can also type any lat/lng — a real deployment would
// wire these fields up to a free geocoding search (e.g. OpenStreetMap's
// Nominatim, no API key needed) instead of manual coordinate entry.
const LANDMARKS = {
  Mumbai: [
    { name: "Bandra", lat: 19.0596, lng: 72.8295 },
    { name: "Andheri", lat: 19.1197, lng: 72.8468 },
    { name: "Marine Drive", lat: 18.9439, lng: 72.8236 },
    { name: "Powai", lat: 19.1176, lng: 72.906 },
  ],
  Delhi: [
    { name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
    { name: "India Gate", lat: 28.6129, lng: 77.2295 },
    { name: "Dwarka", lat: 28.5921, lng: 77.046 },
    { name: "Saket", lat: 28.5245, lng: 77.2066 },
  ],
};

function PointPicker({ label, value, onChange }) {
  const [city, setCity] = useState("Mumbai");
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex gap-2 mb-2">
        {Object.keys(LANDMARKS).map((c) => (
          <button key={c} type="button" onClick={() => setCity(c)}
            className={`text-xs px-2 py-1 rounded-full border ${city === c ? "bg-dusk2 text-white border-dusk2" : "border-gray-200 text-gray-500"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {LANDMARKS[city].map((l) => (
          <button key={l.name} type="button" onClick={() => onChange({ label: l.name, lat: l.lat, lng: l.lng })}
            className={`text-sm px-2 py-1.5 rounded-lg border text-left ${value.label === l.name ? "bg-mist border-dusk2" : "border-gray-200"}`}>
            {l.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <input placeholder="Label" className="col-span-1 px-2 py-1.5 rounded-lg border border-gray-200"
          value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} />
        <input placeholder="Lat" className="px-2 py-1.5 rounded-lg border border-gray-200"
          value={value.lat} onChange={(e) => onChange({ ...value, lat: e.target.value })} />
        <input placeholder="Lng" className="px-2 py-1.5 rounded-lg border border-gray-200"
          value={value.lng} onChange={(e) => onChange({ ...value, lng: e.target.value })} />
      </div>
    </div>
  );
}

export default function RoutePlanner() {
  const [start, setStart] = useState({ label: "Bandra", lat: 19.0596, lng: 72.8295 });
  const [end, setEnd] = useState({ label: "Andheri", lat: 19.1197, lng: 72.8468 });
  const [mode, setMode] = useState("walking");
  const [routes, setRoutes] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [pickField, setPickField] = useState("start"); // "start" | "end" — which pin the next map click sets

  const handleMapPick = (latlng) => {
    const point = { label: "Custom pin", lat: latlng.lat, lng: latlng.lng };
    if (pickField === "start") {
      setStart(point);
      setPickField("end"); // auto-advance so the next click sets the destination
    } else {
      setEnd(point);
    }
  };

  const compare = async () => {
    setBusy(true); setError(""); setRoutes(null); setSaveMsg("");
    try {
      const { data } = await client.get("/routes/compare/", {
        params: { start_lat: start.lat, start_lng: start.lng, end_lat: end.lat, end_lng: end.lng, mode },
      });
      setRoutes(data.routes);
      setSelectedIndex(0);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't compare routes — check your Google Maps API key in backend/.env.");
    } finally {
      setBusy(false);
    }
  };

  const saveRoute = async () => {
    try {
      await client.post("/routes/saved/", {
        name: routeName || `${start.label} to ${end.label}`,
        start_label: start.label, start_lat: start.lat, start_lng: start.lng,
        end_label: end.label, end_lat: end.lat, end_lng: end.lng,
        travel_mode: mode,
      });
      setSaveMsg("Saved — this route will now appear in your daily email.");
    } catch {
      setSaveMsg("Couldn't save the route. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display font-700 text-2xl text-dusk mb-1">Cleaner-air route planner</h1>
      <p className="text-gray-500 text-sm mb-6">
        Compare every route between two points by pollution exposure, not just travel time —
        useful whether you're managing asthma or just want a healthier jog.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <PointPicker label="Start" value={start} onChange={setStart} />
        <PointPicker label="Destination" value={end} onChange={setEnd} />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Or click the map to drop a pin
          </p>
          <div className="flex gap-1 bg-mist rounded-lg p-1">
            <button type="button" onClick={() => setPickField("start")}
              className={`text-xs px-2 py-1 rounded-md ${pickField === "start" ? "bg-dusk2 text-white" : "text-gray-500"}`}>
              Setting: Start
            </button>
            <button type="button" onClick={() => setPickField("end")}
              className={`text-xs px-2 py-1 rounded-md ${pickField === "end" ? "bg-dusk2 text-white" : "text-gray-500"}`}>
              Setting: Destination
            </button>
          </div>
        </div>
        <PointPickerMap start={start} end={end} activeField={pickField} onPick={handleMapPick} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
          {[["walking", "Walk / Jog"], ["bicycling", "Cycle"], ["driving", "Drive"]].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-sm rounded-md ${mode === m ? "bg-dusk2 text-white" : "text-gray-500"}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={compare} disabled={busy}
          className="bg-ember text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
          {busy ? "Comparing…" : "Compare routes"}
        </button>
      </div>

      {error && <div className="bg-verypoor/10 text-verypoor text-sm rounded-lg px-4 py-3 mb-6">{error}</div>}

      {routes && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RouteMap routes={routes} selectedIndex={selectedIndex} onSelectRoute={setSelectedIndex} />
          </div>
          <div className="space-y-3">
            {routes.map((r, i) => (
              <div
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition ${
                  i === selectedIndex ? "border-dusk2" : r.recommended ? "border-good" : "border-transparent hover:border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-dusk2 text-sm">{r.summary || `Route ${i + 1}`}</span>
                  <div className="flex items-center gap-1">
                    {r.recommended && <span className="text-[11px] bg-good/15 text-good px-2 py-0.5 rounded-full font-medium">Cleanest air</span>}
                    {i === selectedIndex && <span className="text-[11px] bg-dusk2/10 text-dusk2 px-2 py-0.5 rounded-full font-medium">Shown on map</span>}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{r.distance_text} · {r.duration_text}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono font-700" style={{ color: r.color }}>{r.avg_aqi ?? "—"}</span>
                  <span className="text-sm" style={{ color: r.color }}>{r.category}</span>
                </div>
                {r.worst_aqi && <p className="text-[11px] text-gray-400 mt-1">Worst point along route: AQI {r.worst_aqi}</p>}
              </div>
            ))}

            <div className="bg-mist rounded-xl p-4 mt-4">
              <input placeholder="Name this route (e.g. Morning jog)" value={routeName} onChange={(e) => setRouteName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2" />
              <button onClick={saveRoute} className="w-full bg-dusk2 text-white py-2 rounded-lg text-sm hover:bg-dusk transition">
                Save route (included in daily email)
              </button>
              {saveMsg && <p className="text-xs text-gray-500 mt-2">{saveMsg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}