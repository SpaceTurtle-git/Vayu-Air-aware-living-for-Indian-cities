import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import WeatherCard from "../components/WeatherCard.jsx";
import AqiCard from "../components/AqiCard.jsx";
import PredictionChart from "../components/PredictionChart.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const lat = user?.profile?.latitude;
  const lng = user?.profile?.longitude;

  useEffect(() => {
    if (lat == null || lng == null) return;
    setLoading(true);
    Promise.allSettled([
      client.get("/weather/dashboard/", { params: { lat, lng } }),
      client.get("/predictions/aqi/", { params: { lat, lng, days: 7 } }),
    ]).then(([dashRes, predRes]) => {
      if (dashRes.status === "fulfilled") setData(dashRes.value.data);
      else setError("Couldn't load live weather/AQI data — check your API keys in backend/.env.");
      if (predRes.status === "fulfilled") setForecast(predRes.value.data);
      setLoading(false);
    });
  }, [lat, lng]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl text-dusk">
            Hi {user?.first_name || user?.username} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{user?.profile?.city_name}</p>
        </div>
        <Link to="/routes" className="bg-dusk2 text-white text-sm px-4 py-2 rounded-lg hover:bg-dusk transition">
          Plan a cleaner route →
        </Link>
      </div>

      {error && <div className="bg-verypoor/10 text-verypoor text-sm rounded-lg px-4 py-3 mb-6">{error}</div>}
      {loading && <p className="text-gray-400 text-sm">Loading your air…</p>}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeatherCard weather={data.weather} />
          {/* <AqiCard aqi={data.aqi} waqiStation={data.waqi_station} healthAdvisory={data.health_advisory} /> */}
          <AqiCard
            aqi={data.aqi}
            location={data.weather.city_name}
            healthAdvisory={data.health_advisory}
          />
          <div className="lg:col-span-2">
            <PredictionChart forecast={forecast?.forecast} note={forecast?.note} />
          </div>
        </div>
      )}
    </div>
  );
}
