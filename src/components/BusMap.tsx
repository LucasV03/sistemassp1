"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { DivIcon, LatLngBounds } from "leaflet";
import { useEffect, useMemo, useState } from "react";

export type Bus = {
  id: string;
  lat: number;
  lng: number;
  route: string;
  speedKmH: number;
  heading?: number;     // 0–360
  updatedAt: string;
};

const busIcon = (heading = 0) =>
  new DivIcon({
    html: `<div style="font-size:22px;line-height:1;transform:rotate(${heading}deg);transform-origin:center;">🚌</div>`,
    className: "bus-icon",
    iconSize: [22, 22],
  });

type Props = { buses: Bus[]; className?: string };

const DEFAULT_CENTER: [number, number] = [-24.7821, -65.4232];

/** Ajusta el encuadre cuando cambian los bounds */
function FitBounds({ bounds }: { bounds: LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds.pad(0.2));
  }, [bounds, map]);
  return null;
}

export default function BusMap({ buses, className }: Props) {
  const [items, setItems] = useState<Bus[]>(buses);

  // (Demo) movimiento leve cada 5s
  useEffect(() => {
    const id = setInterval(() => {
      setItems(prev =>
        prev.map(b => {
          const dx = (Math.random() - 0.5) * 0.001;
          const dy = (Math.random() - 0.5) * 0.001;
          return {
            ...b,
            lat: b.lat + dx,
            lng: b.lng + dy,
            heading: (b.heading ?? 0) + (Math.random() - 0.5) * 30,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const bounds = useMemo(() => {
    if (!items.length) return null;
    return L.latLngBounds(items.map(b => L.latLng(b.lat, b.lng)));
  }, [items]);

  return (
    <div className={`relative overflow-hidden rounded-lg border ${className ?? ""}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom
        style={{ height: 300, width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Ajuste de encuadre sin whenCreated */}
        <FitBounds bounds={bounds} />

        {items.map(b => (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={busIcon(b.heading ?? 0)}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{b.id}</div>
                <div>Ruta: {b.route}</div>
                <div>Vel.: {b.speedKmH} km/h</div>
                <div className="text-xs text-slate-500">
                  Act.: {new Date(b.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
