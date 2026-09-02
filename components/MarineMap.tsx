"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MarineMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    const map = L.map(mapRef.current, {
      center: [17.6868, 83.2185],
      zoom: 9,
      zoomControl: true,
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    ).addTo(map);

    const currentLocation = L.circleMarker(
      [17.6868, 83.2185],
      {
        radius: 8,
        weight: 3,
        fillOpacity: 1,
      }
    ).addTo(map);

    currentLocation.bindPopup(`
      <strong>📍 Visakhapatnam</strong><br/>
      Current operating location
    `);

    fetch("/api/pfz")
      .then((res) => {
        if (!res.ok) {
          throw new Error("PFZ API request failed");
        }

        return res.json();
      })
      .then((data) => {
        if (cancelled || !data?.zones) return;

        data.zones.forEach(
          (zone: {
            id: string;
            latitude: number;
            longitude: number;
            suitability: string;
            confidence: number;
            distanceFromCoast: number;
            estimatedCatchPotential: string;
            factors?: {
              seaSurfaceTemperature?: number;
              chlorophyll?: number;
              oceanCondition?: string;
            };
          }) => {
            if (cancelled || !mapRef.current) return;

            const radius =
              zone.suitability === "HIGH"
                ? 8000
                : zone.suitability === "MODERATE"
                ? 7000
                : 6000;

            const pfz = L.circle(
              [zone.latitude, zone.longitude],
              {
                radius,
                fillOpacity: 0.25,
                weight: 2,
              }
            ).addTo(map);

            pfz.bindPopup(`
              <strong>🎣 ${zone.id}</strong><br/>
              Suitability: ${zone.suitability}<br/>
              Confidence: ${(zone.confidence * 100).toFixed(0)}%<br/>
              Distance from coast: ${zone.distanceFromCoast} km<br/>
              Catch potential: ${zone.estimatedCatchPotential}<br/>
              ${
                zone.factors?.seaSurfaceTemperature !== undefined
                  ? `SST: ${zone.factors.seaSurfaceTemperature}°C<br/>`
                  : ""
              }
              ${
                zone.factors?.chlorophyll !== undefined
                  ? `Chlorophyll: ${zone.factors.chlorophyll}<br/>`
                  : ""
              }
              ${
                zone.factors?.oceanCondition
                  ? `Ocean: ${zone.factors.oceanCondition}`
                  : ""
              }
            `);
          }
        );
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Unable to load PFZ data:", error);
        }
      });

    const hazard = L.circle(
      [17.72, 83.72],
      {
        radius: 10000,
        fillOpacity: 0.2,
        weight: 2,
        dashArray: "8 6",
      }
    ).addTo(map);

    hazard.bindPopup(`
      <strong>⚠️ Marine Hazard Zone</strong><br/>
      Elevated wave conditions<br/>
      Exercise caution
    `);

    const advisory = L.marker([17.60, 83.30]).addTo(map);

    advisory.bindPopup(`
      <strong>⚠️ Fishermen Advisory</strong><br/>
      Wave height: 1.8 m<br/>
      Wind speed: 24 km/h
    `);

    const legend = new L.Control({
      position: "bottomright",
    });

    legend.onAdd = function () {
      const div = L.DomUtil.create(
        "div",
        "marine-map-legend"
      );

      div.innerHTML = `
        <div style="
          background: rgba(6,17,31,0.95);
          color: white;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          font-size: 12px;
          line-height: 1.8;
        ">
          <strong>Marine Map</strong><br/>
          📍 Current Location<br/>
          🎣 Fishing Zone<br/>
          ⚠️ Hazard Area
        </div>
      `;

      return div;
    };

    legend.addTo(map);

    setTimeout(() => {
      if (!cancelled) {
        map.invalidateSize();
      }
    }, 100);

    return () => {
      cancelled = true;
      map.remove();
    };
  }, []);

  return (
    <div className="relative z-0 w-full overflow-hidden rounded-2xl">
      <div
        ref={mapRef}
        className="w-full rounded-2xl"
        style={{
          height: "420px",
        }}
      />
    </div>
  );
}