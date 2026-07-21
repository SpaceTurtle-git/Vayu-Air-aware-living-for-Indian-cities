import React from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";

function FitBounds({ routes }) {
  const map = useMap();
  React.useEffect(() => {
    const allPoints = routes.flatMap((r) => r.polyline);
    if (allPoints.length) map.fitBounds(allPoints, { padding: [30, 30] });
  }, [routes, map]);
  return null;
}

export default function RouteMap({ routes, selectedIndex = 0, onSelectRoute }) {
  if (!routes || routes.length === 0) return null;
  const center = routes[0].polyline[Math.floor(routes[0].polyline.length / 2)];

  // Draw the selected route last so it renders on top of the others.
  const ordered = routes
    .map((r, i) => ({ ...r, _index: i }))
    .sort((a, b) => (a._index === selectedIndex ? 1 : b._index === selectedIndex ? -1 : 0));

  return (
    <MapContainer center={center} zoom={13} style={{ height: 420, width: "100%", borderRadius: 16 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds routes={routes} />
      {ordered.map((r) => {
        const isSelected = r._index === selectedIndex;
        return (
          <Polyline
            key={r._index}
            positions={r.polyline}
            pathOptions={{
              color: r.color,
              weight: isSelected ? 7 : 3,
              opacity: isSelected ? 1 : 0.35,
            }}
            eventHandlers={{
              click: () => onSelectRoute?.(r._index),
            }}
          />
        );
      })}
      {routes[selectedIndex]?.sampled_points?.map((p, j) => (
        <CircleMarker
          key={`sel-${j}`}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{ color: "#14213D", fillColor: routes[selectedIndex].color, fillOpacity: 1, weight: 1 }}
        >
          <Popup>AQI {p.aqi ?? "N/A"}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}