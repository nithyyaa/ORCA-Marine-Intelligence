"use client";



import { useEffect, useRef, useState } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";



type PFZZone = {

  zone_id: string;

  latitude: number;

  longitude: number;

  sector?: string | null;

  year?: number | null;

  julian_day?: string | null;

  length_km?: number | null;

  source?: string;

  distance_km?: string | number;

};



type MarineHazard = {

  type?: string;

  severity?: string;

  title?: string;

  message?: string;

  value?: number | string | null;

  unit?: string | null;

};



type RouteFeature = {

  id?: string;

  name?: string;

  geometry?: Array<[number, number]>;

  distanceKm?: number;

  estimatedTimeMinutes?: number;

  safetyScore?: number;

  riskLevel?: string;

  hazardExposure?: string;

};



type MarineLocation = {

  latitude: number;

  longitude: number;

};



function isValidLocation(latitude: unknown, longitude: unknown) {

  const lat = Number(latitude);

  const lon = Number(longitude);



  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;



  // ORCA must never treat the common 0,0 placeholder as a real operating

  // location.

  if (lat === 0 && lon === 0) return false;



  return true;

}



function normalizeLocation(parsed: any): MarineLocation | null {

  if (!parsed || !isValidLocation(parsed.latitude, parsed.longitude)) {

    return null;

  }



  return {

    latitude: Number(parsed.latitude),

    longitude: Number(parsed.longitude),

  };

}



function readUrlLocation() {

  try {

    const params = new URLSearchParams(window.location.search);



    return normalizeLocation({

      latitude: params.get("lat"),

      longitude: params.get("lon"),

    });

  } catch {

    return null;

  }

}



function readStoredLocation() {

  // Settings writes the selected operating location to localStorage first.

  // The cookie is only a browser-side compatibility fallback.

  try {

    const raw = localStorage.getItem("orca-location");



    if (raw) {

      const parsed = JSON.parse(raw);

      const location = normalizeLocation(parsed);



      if (location) return location;

    }

  } catch {

    // Continue to cookie fallback.

  }



  try {

    const locationCookie = document.cookie

      .split(";")

      .map((value) => value.trim())

      .find((cookie) => cookie.startsWith("orca-location="));



    if (locationCookie) {

      const encoded = locationCookie.substring("orca-location=".length);

      const parsed = JSON.parse(decodeURIComponent(encoded));

      const location = normalizeLocation(parsed);



      if (location) return location;

    }

  } catch {

    // No valid browser-side location available.

  }



  return null;

}



function esc(value: unknown) {

  return String(value ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}



const currentLocationIcon = L.divIcon({

  className: "",

  html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:26px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">📍</div>`,

  iconSize: [28, 28],

  iconAnchor: [14, 28],

  popupAnchor: [0, -28],

});



const pfzIcon = L.divIcon({

  className: "",

  html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:25px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">🎣</div>`,

  iconSize: [30, 30],

  iconAnchor: [15, 30],

  popupAnchor: [0, -30],

});



const hazardIcon = L.divIcon({

  className: "",

  html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:25px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">⚠️</div>`,

  iconSize: [30, 30],

  iconAnchor: [15, 30],

  popupAnchor: [0, -30],

});



const makeCircleIcon = (label: string) =>

  L.divIcon({

    className: "",

    html: `<div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.9);border:2px solid #0ea5e9;color:#0f172a;font-size:11px;font-weight:700">${label}</div>`,

    iconSize: [22, 22],

    iconAnchor: [11, 11],

  });



export default function MarineMap() {

  const mapRef = useRef<HTMLDivElement>(null);



  const [locationVersion, setLocationVersion] = useState(0);

  const [timelineHour, setTimelineHour] = useState(0);

  const [timelineData, setTimelineData] = useState<any>(null);

  const [timelineLoading, setTimelineLoading] = useState(false);

  const [locationAvailable, setLocationAvailable] = useState(true);

  const timelineRendererRef = useRef<(() => void) | null>(null);



  useEffect(() => {

    const locationFromUrl = readUrlLocation();

    const storedLocation = readStoredLocation();

    const location = locationFromUrl ?? storedLocation;



    let cancelled = false;



    if (!location) {

      setTimelineData(null);

      setTimelineLoading(false);

      setLocationAvailable(false);

      return () => {

        cancelled = true;

      };

    }



    setLocationAvailable(true);

    setTimelineLoading(true);



    fetch(

      `/api/map-forecast?lat=${encodeURIComponent(

        location.latitude

      )}&lon=${encodeURIComponent(location.longitude)}&hours=24`,

      { cache: "no-store" }

    )

      .then(async (res) => {

        if (!res.ok) throw new Error("Map forecast unavailable");

        return res.json();

      })

      .then((data) => {

        if (!cancelled) setTimelineData(data);

      })

      .catch(() => {

        if (!cancelled) setTimelineData(null);

      })

      .finally(() => {

        if (!cancelled) setTimelineLoading(false);

      });



    return () => {

      cancelled = true;

    };

  }, [locationVersion]);



  useEffect(() => {

    if (!mapRef.current) return;



    let cancelled = false;



    const locationFromUrl = readUrlLocation();

    const storedLocation = readStoredLocation();

    const location = locationFromUrl ?? storedLocation;



    if (!location) {

      setLocationAvailable(false);

      return;

    }



    setLocationAvailable(true);



    const { latitude, longitude } = location;



    const handleLocationChanged = () => {

      setTimelineHour(0);

      setTimelineData(null);

      setLocationVersion((version) => version + 1);

    };



    window.addEventListener(

      "orca-location-changed",

      handleLocationChanged

    );



    console.log("ORCA MarineMap selected location:", {

      latitude,

      longitude,

      source: locationFromUrl

        ? "url"

        : "settings/localStorage/cookie",

    });



    const map = L.map(mapRef.current, {

      center: [latitude, longitude],

      zoom: locationFromUrl ? 10 : 7,

      zoomControl: true,

    });



    const base = L.tileLayer(

      "https\://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

      {

        attribution: "&copy; OpenStreetMap contributors",

      }

    ).addTo(map);



    const layers: Record<string, L.LayerGroup | L.Layer> = {};



    const userLayer = L.layerGroup().addTo(map);

    const eezLayerGroup = L.layerGroup().addTo(map);

    const pfzLayer = L.layerGroup().addTo(map);

    const hazardLayer = L.layerGroup().addTo(map);

    const weatherLayer = L.layerGroup().addTo(map);

    const waveLayer = L.layerGroup().addTo(map);

    const routeLayer = L.layerGroup();



    layers["User / Vessel"] = userLayer;

    layers["EEZ / Maritime Boundary"] = eezLayerGroup;

    layers["PFZ"] = pfzLayer;

    layers["Hazard Zones"] = hazardLayer;

    layers["Weather / Wind"] = weatherLayer;

    layers["Waves"] = waveLayer;

    layers["Recommended / Alternative Routes"] = routeLayer;



    L.marker([latitude, longitude], {
  icon: hazardIcon,
  zIndexOffset: 1000,
})

      .bindPopup(

        `<strong>📍 Current / Vessel Location</strong><br/>${latitude.toFixed(

          5

        )}, ${longitude.toFixed(5)}`

      )

      .addTo(userLayer);



    // EEZ / maritime boundary.

    fetch(

      `/api/geofence?lat=${encodeURIComponent(

        latitude

      )}&lon=${encodeURIComponent(longitude)}`,

      { cache: "no-store" }

    )

      .then(async (res) => (res.ok ? res.json() : null))

      .then((data) => {

        if (cancelled || !data?.boundary?.geometry) return;



        const layer = L.geoJSON(

          data.boundary.geometry as GeoJSON.Geometry,

          {

            style: {

              color: "#0ea5e9",

              weight: 2,

              opacity: 0.9,

              fillColor: "#0ea5e9",

              fillOpacity: 0.06,

            },

          }

        );



        layer.bindPopup(

          `<strong>🌊 EEZ / Maritime Boundary</strong><br/>

           Status: ${

             data.insideEEZ ? "Inside EEZ" : "Outside EEZ"

           }<br/>

           Distance to boundary: ${

             data.distanceToBoundaryKm ?? "N/A"

           } km<br/>

           Source: ${esc(data.source ?? "Marine boundary data")}`

        );



        layer.addTo(eezLayerGroup);

      })

      .catch(() => {});



    // Live PFZ data from PostGIS-backed nearby API.

    fetch(

      `/api/pfz/nearby?lat=${encodeURIComponent(

        latitude

      )}&lon=${encodeURIComponent(longitude)}`,

      { cache: "no-store" }

    )

      .then(async (res) => (res.ok ? res.json() : null))

      .then((data) => {

        if (cancelled || !Array.isArray(data?.zones)) return;



        data.zones.forEach((zone: PFZZone) => {

          if (

            !Number.isFinite(zone.latitude) ||

            !Number.isFinite(zone.longitude)

          ) {

            return;

          }



          const distance = Number.isFinite(

            Number(zone.distance_km)

          )

            ? `${Number(zone.distance_km).toFixed(2)} km`

            : "Unavailable";



          L.marker([zone.latitude, zone.longitude], {

            icon: pfzIcon,

          })

            .bindPopup(

              `<strong>🎣 Potential Fishing Zone</strong><br/>

               ID: ${esc(zone.zone_id)}<br/>

               Distance: ${distance}<br/>

               Sector: ${esc(

                 zone.sector ?? "Not specified"

               )}<br/>

               Length: ${

                 zone.length_km != null

                   ? `${Number(zone.length_km).toFixed(2)} km`

                   : "Unavailable"

               }<br/>

               Source: ${esc(zone.source ?? "INCOIS")}<br/>

               <em>Suitability is not inferred when the source does not provide it.</em>`

            )

            .addTo(pfzLayer);

        });

      })

      .catch(() => {});



    // Live hazard layer.

    fetch(

      `/api/hazard?lat=${encodeURIComponent(

        latitude

      )}&lon=${encodeURIComponent(longitude)}`,

      { cache: "no-store" }

    )

      .then(async (res) => (res.ok ? res.json() : null))

      .then((data) => {

        if (

          cancelled ||

          !data?.live ||

          !Array.isArray(data.hazards)

        ) {

          return;

        }



        data.hazards.forEach((hazard: MarineHazard) => {

          L.marker([latitude, longitude], {

            icon: hazardIcon,

          })

            .bindPopup(

              `<strong>⚠️ ${esc(

                hazard.title ??

                  hazard.type ??

                  "Marine Hazard"

              )}</strong><br/>

               Severity: ${esc(

                 hazard.severity ??

                   data.riskLevel ??

                   "UNKNOWN"

               )}<br/>

               ${esc(hazard.message ?? "")}<br/>

               ${

                 hazard.value != null

                   ? `Value: ${esc(

                       hazard.value

                     )} ${esc(

                       hazard.unit ?? ""

                     )}<br/>`

                   : ""

               }

               Source: ${esc(

                 Array.isArray(data.source)

                   ? data.source.join(", ")

                   : data.source ??

                       "Live marine data"

               )}`

            )

            .addTo(hazardLayer);

        });

      })

      .catch(() => {});



    let weatherMarker: L.Marker | null = null;

    let waveMarker: L.Marker | null = null;



    const renderTimelinePoint = (

      hoursFromNow: number

    ) => {

      if (cancelled) return;



      if (weatherMarker) {

        weatherLayer.removeLayer(weatherMarker);

      }



      if (waveMarker) {

        waveLayer.removeLayer(waveMarker);

      }



      const rows = Array.isArray(

        timelineData?.hourly

      )

        ? timelineData.hourly

        : [];



      const row =

        rows.find(

          (item: any) =>

            Number(item.hoursFromNow) ===

            hoursFromNow

        ) ?? rows[0];



      if (row) {

        const label =

          hoursFromNow === 0

            ? "Now"

            : `+${hoursFromNow}h`;



        weatherMarker = L.marker(

          [latitude, longitude],

          {

            icon: makeCircleIcon("W"),

          }

        )

          .bindPopup(

            `<strong>🌬️ Weather / Wind — ${label}</strong><br/>

             Wind: ${

               Number.isFinite(

                 Number(row.windSpeed)

               )

                 ? `${row.windSpeed} km/h`

                 : "Unavailable"

             }<br/>

             Direction: ${

               Number.isFinite(

                 Number(row.windDirection)

               )

                 ? `${row.windDirection}°`

                 : "Unavailable"

             }<br/>

             Precipitation probability: ${

               row.precipitationProbability !=

               null

                 ? `${row.precipitationProbability}%`

                 : "Unavailable"

             }<br/>

             Weather code: ${

               row.weatherCode != null

                 ? row.weatherCode

                 : "Unavailable"

             }<br/>

             Forecast time: ${esc(

               row.time

             )}<br/>

             Source: ${esc(

               timelineData?.sources

                 ?.weather ?? "Open-Meteo"

             )}`

          )

          .addTo(weatherLayer);



        const marineAvailable =

          timelineData?.dataAvailability

            ?.marine !== false;



        waveMarker = L.marker(

          [latitude, longitude],

          {

            icon: makeCircleIcon("≈"),

          }

        )

          .bindPopup(

            `<strong>🌊 Waves / Ocean — ${label}</strong><br/>

             Wave height: ${

               marineAvailable &&

               Number.isFinite(

                 Number(row.waveHeight)

               )

                 ? `${row.waveHeight} m`

                 : "Unavailable"

             }<br/>

             Wave direction: ${

               marineAvailable &&

               Number.isFinite(

                 Number(row.waveDirection)

               )

                 ? `${row.waveDirection}°`

                 : "Unavailable"

             }<br/>

             Wave period: ${

               marineAvailable &&

               Number.isFinite(

                 Number(row.wavePeriod)

               )

                 ? `${row.wavePeriod} s`

                 : "Unavailable"

             }<br/>

             Forecast time: ${esc(

               row.time

             )}<br/>

             Source: ${

               marineAvailable

                 ? esc(

                     timelineData?.sources

                       ?.marine ??

                       "Open-Meteo Marine API"

                   )

                 : "Unavailable"

             }`

          )

          .addTo(waveLayer);



        return;

      }



      // Fallback to current conditions only for the current timeline point.

      if (hoursFromNow !== 0) return;



      Promise.all([

        fetch("/api/weather", {

          cache: "no-store",

        }),

        fetch("/api/ocean", {

          cache: "no-store",

        }),

      ])

        .then(async ([weatherRes, oceanRes]) => ({

          weather: weatherRes.ok

            ? await weatherRes.json()

            : null,

          ocean: oceanRes.ok

            ? await oceanRes.json()

            : null,

        }))

        .then(({ weather, ocean }) => {

          if (cancelled) return;



          weatherMarker = L.marker(

            [latitude, longitude],

            {

              icon: makeCircleIcon("W"),

            }

          )

            .bindPopup(

              `<strong>🌬️ Weather / Wind — Now</strong><br/>

               Wind: ${

                 weather?.windSpeed != null

                   ? `${weather.windSpeed} km/h`

                   : "Unavailable"

               }<br/>

               Direction: ${

                 weather?.windDirection != null

                   ? `${weather.windDirection}°`

                   : "Unavailable"

               }<br/>

               Temperature: ${

                 weather?.temperature != null

                   ? `${weather.temperature}°C`

                   : "Unavailable"

               }<br/>

               Source: ${esc(

                 weather?.source ??

                   "Open-Meteo"

               )}`

            )

            .addTo(weatherLayer);



          waveMarker = L.marker(

            [latitude, longitude],

            {

              icon: makeCircleIcon("≈"),

            }

          )

            .bindPopup(

              `<strong>🌊 Waves / Ocean — Now</strong><br/>

               Wave height: ${

                 ocean?.waveHeight != null

                   ? `${ocean.waveHeight} m`

                   : "Unavailable"

               }<br/>

               Wave direction: ${

                 ocean?.waveDirection != null

                   ? `${ocean.waveDirection}°`

                   : "Unavailable"

               }<br/>

               SST: ${

                 ocean?.sst != null

                   ? `${ocean.sst}°C`

                   : "Unavailable"

               }<br/>

               Source: ${esc(

                 ocean?.source ??

                   "Open-Meteo Marine API"

               )}`

            )

            .addTo(waveLayer);

        })

        .catch(() => {});

    };



    timelineRendererRef.current = () => {
    renderTimelinePoint(timelineHour);
  };

  renderTimelinePoint(timelineHour);



    // Route overlays are intentionally left empty here because the existing

    // route service is POST-based and requires a user-supplied destination.

    // We do not invent a destination or fabricate route geometry.



    const overlays: Record<

      string,

      L.Layer

    > = {

      "📍 User / Vessel": userLayer,

      "🌊 EEZ / Maritime Boundary":

        eezLayerGroup,

      "🎣 PFZ": pfzLayer,

      "⚠️ Hazard Zones": hazardLayer,

      "🌬️ Weather / Wind": weatherLayer,

      "🌊 Waves": waveLayer,

      "🧭 Recommended / Alternative Routes":

        routeLayer,

    };



    L.control

      .layers(

        {

          OpenStreetMap: base,

        },

        overlays,

        {

          collapsed: true,

          position: "topright",

        }

      )

      .addTo(map);



    setTimeout(() => {

      if (!cancelled) {

        map.invalidateSize();

      }

    }, 100);



    return () => {

      cancelled = true;



      window.removeEventListener(

        "orca-location-changed",

        handleLocationChanged

      );



      timelineRendererRef.current = null;

      map.remove();

    };

  }, [locationVersion]);

  useEffect(() => {

    timelineRendererRef.current?.();

  }, [timelineHour, timelineData]);



  if (!locationAvailable) {

    return (

      <div

        className="relative z-0 w-full rounded-2xl"

        style={{ height: "520px" }}

      >

        <div

          className="flex h-full w-full items-center justify-center rounded-2xl"

          style={{

            background:

              "rgba(6,17,31,.97)",

            color: "#fff",

            padding: "24px",

            textAlign: "center",

          }}

        >

          <div>

            <div

              style={{

                fontSize: "32px",

                marginBottom: "10px",

              }}

            >

              📍

            </div>



            <div

              style={{

                fontWeight: 800,

                fontSize: "16px",

                marginBottom: "6px",

              }}

            >

              Operating location required

            </div>



            <div

              style={{

                opacity: 0.75,

                fontSize: "13px",

              }}

            >

              Set a valid operating location in

              ORCA Settings to load marine

              intelligence on the map.

            </div>

          </div>

        </div>

      </div>

    );

  }



  return (

    <div

      className="relative z-0 w-full rounded-2xl"

      style={{ height: "520px" }}

    >

      <div

        ref={mapRef}

        className="w-full rounded-2xl"

        style={{

          height: "520px",

          overflow: "hidden",

        }}

      />



      <div

        style={{

          position: "absolute",

          left: "14px",
          top: "14px",
          zIndex: 1000,
          width: "245px",

          background: "rgba(6,17,31,.96)",

          color: "#fff",

          padding: "10px 12px",

          borderRadius: "10px",

          boxShadow:

            "0 4px 16px rgba(0,0,0,.28)",

          fontSize: "11px",

          lineHeight: 1.45,

          pointerEvents: "none",

        }}

      >

        <div

          style={{

            fontWeight: 800,

            fontSize: "12px",

            marginBottom: "4px",

          }}

        >

          Marine Intelligence

        </div>



        <div>

          SST: Point value in Ocean

          Conditions

        </div>



        <div>

          Chlorophyll: Unavailable /

          historical prototype

        </div>



        <div>

          Cyclone path: Unavailable

        </div>



        <div>

          Lightning: Unavailable

        </div>



        <div>

          Restricted / MPA: Not connected

          yet

        </div>

      </div>



      <div

        style={{

          position: "absolute",

          left: "50%",

          bottom: "14px",

          transform: "translateX(-50%)",

          zIndex: 1000,

          width: "min(720px, calc(100% - 28px))",

          maxWidth: "720px",

          minWidth: "0",

          background: "rgba(6,17,31,.97)",

          color: "#fff",

          padding: "10px 14px",

          borderRadius: "10px",

          boxShadow:

            "0 4px 16px rgba(0,0,0,.28)",

          fontSize: "11px",

          boxSizing: "border-box",

        }}

      >

        <div

          style={{

            fontWeight: 800,

            fontSize: "12px",

            marginBottom: "5px",

          }}

        >

          Timeline

        </div>



        <input

          type="range"

          min="0"

          max="24"

          step="2"

          aria-label="Map timeline"

          style={{

            width: "100%",

            cursor: "pointer",

          }}

          value={timelineHour}

          onChange={(event) => {

            setTimelineHour(

              Number(event.currentTarget.value)

            );

          }}

        />



        <div

          style={{

            display: "flex",

            justifyContent: "space-between",

            marginTop: "3px",

            opacity: 0.9,

          }}

        >

          <span>Now</span>

          <span>6h</span>

          <span>12h</span>

          <span>18h</span>

          <span>24h</span>

        </div>



        <div

          style={{

            marginTop: "3px",

            opacity: 0.9,

          }}

        >

          Selected:{" "}

          <strong>

            {timelineHour === 0

              ? "Now"

              : `+${timelineHour}h`}

          </strong>



          {timelineLoading

            ? " · Loading forecast…"

            : timelineData

            ? " · Forecast loaded"

            : " · Forecast unavailable"}

        </div>



        <div

          style={{

            marginTop: "2px",

            opacity: 0.65,

          }}

        >

          Wind, precipitation

          probability and waves update to

          the selected forecast hour.

        </div>

      </div>

    </div>

  );

}