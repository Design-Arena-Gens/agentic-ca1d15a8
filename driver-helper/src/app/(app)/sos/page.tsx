"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { AlertCircle, CheckCircle2, Phone, ShieldAlert } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

function MapView({ latitude, longitude }: { latitude: number; longitude: number }) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    const loader = new Loader({ apiKey, version: "weekly" });
    let map: google.maps.Map | null = null;
    const init = async () => {
      try {
        const googleMaps = await (loader as unknown as { load: () => Promise<any> }).load();
        const center = { lat: latitude, lng: longitude };
        map = new googleMaps.maps.Map(mapRef.current as HTMLElement, {
          center,
          zoom: 14,
          disableDefaultUI: true,
        });
        new googleMaps.maps.Marker({
          position: center,
          map,
          title: "Your location",
        });
      } catch (error) {
        console.error("Failed to load map", error);
      }
    };
    init();
    return () => {
      if (map) {
        map = null;
      }
    };
  }, [latitude, longitude]);

  return <div ref={mapRef} className="h-64 w-full overflow-hidden rounded-3xl" />;
}

export default function SosPage() {
  const addSosLog = useAppStore((state) => state.addSosLog);
  const nearbyDrivers = useAppStore((state) => state.nearbyDrivers);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [message, setMessage] = useState("I need assistance.");

  useEffect(() => {
    if (!coords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setStatus("Location access denied. Map may be limited.");
        },
        { enableHighAccuracy: true },
      );
    }
  }, [coords]);

  const triggerSos = async () => {
    if (loading) return;
    setLoading(true);
    setStatus(null);
    try {
      let latitude: number | null = coords?.lat ?? null;
      let longitude: number | null = coords?.lng ?? null;

      if (!coords && navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
          }),
        );
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        setCoords({ lat: latitude, lng: longitude });
      }

      const address = latitude && longitude
        ? `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`
        : "Location unavailable";

      await addSosLog({
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        address,
        message: message.trim() || "Emergency SOS triggered",
        status: "sent",
      });
      setStatus("SOS alert sent to nearby drivers and emergency contacts.");
    } catch (error) {
      console.error(error);
      setStatus("Unable to send SOS. Please try again or call emergency services.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-red-500 via-orange-500 to-red-600 p-6 text-white shadow-xl">
        <h1 className="text-3xl font-semibold">Emergency SOS</h1>
        <p className="mt-2 text-sm text-white/90">
          Press SOS to instantly alert trusted drivers and share your live location.
        </p>
        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Custom Message
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
            placeholder="Describe your emergency"
          />
        </div>
        <div className="mt-6 flex flex-col items-center gap-6">
          <button
            onClick={triggerSos}
            disabled={loading}
            className="flex h-40 w-40 items-center justify-center rounded-full bg-white text-red-600 shadow-2xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-75"
          >
            <div className="flex flex-col items-center text-center">
              <ShieldAlert className="h-10 w-10" />
              <span className="mt-2 text-2xl font-bold">SOS</span>
            </div>
          </button>
          <p className="text-xs text-white/80">
            * Sends alert with your latest coordinates and profile information
          </p>
        </div>
        {status && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm">
            {status.includes("sent") ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-300" />
            )}
            <span>{status}</span>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Live Location</h2>
          <span className="text-sm text-slate-500">
            {coords ? `Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}` : "Fetching..."}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
          {coords ? (
            <MapView latitude={coords.lat} longitude={coords.lng} />
          ) : (
            <div className="flex h-64 items-center justify-center bg-slate-100 text-slate-500">
              Enabling map preview...
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md">
        <div className="flex items-center gap-3">
          <UsersIcon />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Nearby Drivers
            </h2>
            <p className="text-sm text-slate-500">
              Trusted helpers within 2 km radius
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-3">
          {nearbyDrivers.map((driver) => (
            <li
              key={driver.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{driver.name}</p>
                <p className="text-xs text-slate-500">
                  {driver.vehicle} · {driver.distance_km?.toFixed(1)} km away
                </p>
              </div>
              <a
                href={`tel:${driver.phone}`}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function UsersIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
        <path d="M13 7a3 3 0 10-6 0 3 3 0 006 0z" />
        <path fillRule="evenodd" d="M5 14a4 4 0 118 0v1H5v-1z" clipRule="evenodd" />
      </svg>
    </div>
  );
}
