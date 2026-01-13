import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';

// Create / return a DivIcon that contains a badge (label) and a dot
function createDivIcon(label = "") {
  const safeLabel = String(label || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `
    <div class="custom-pin">
      <div class="pin-badge">${safeLabel}</div>
      <div class="pin-dot"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-pin-wrapper',
    iconSize: [56, 64],
    iconAnchor: [28, 62],
    popupAnchor: [0, -60]
  });
}

// Recenter map when coords change
function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], zoom || map.getZoom(), { animate: true });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat, e.latlng.lng); }
  });
  return null;
}

/*
  Props:
  - lat, lng: numbers or null
  - onChange(lat, lng)
  - zoom, height
  - pinLabel: string to show in badge (price or custom)
*/
export default function MapPicker({
  lat = null,
  lng = null,
  onChange = () => {},
  zoom = 13,
  height = 320,
  pinLabel = ""
}) {
  const center = (lat !== null && lng !== null) ? [lat, lng] : [36.8065, 10.1815];

  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onChange={onChange} />

        <Recenter lat={lat} lng={lng} zoom={zoom} />

        {lat !== null && lng !== null && (
          <Marker
            position={[lat, lng]}
            draggable
            icon={createDivIcon(pinLabel)}
            eventHandlers={{
              dragend(e) {
                const pos = e.target.getLatLng();
                onChange(pos.lat, pos.lng);
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}