import React from "react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";

function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng); // { lat, lng }
    },
  });
  return null;
}

// Lets the user click anywhere on the map to set whichever point
// (start or end) is currently "active".
export default function PointPickerMap({ start, end, activeField, onPick, center = [19.076, 72.8777] }) {
  return (
    <MapContainer center={center} zoom={12} style={{ height: 300, width: "100%", borderRadius: 16 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onPick={onPick} />
      {start.lat && start.lng && (
        <CircleMarker center={[start.lat, start.lng]} radius={8}
          pathOptions={{ color: "#14213D", fillColor: "#2A9D8F", fillOpacity: 1, weight: 2 }} />
      )}
      {end.lat && end.lng && (
        <CircleMarker center={[end.lat, end.lng]} radius={8}
          pathOptions={{ color: "#14213D", fillColor: "#E76F51", fillOpacity: 1, weight: 2 }} />
      )}
    </MapContainer>
  );
}