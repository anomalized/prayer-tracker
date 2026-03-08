"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const MECCA = { lat: 21.4225, lng: 39.8262 };
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function getQibla(lat: number, lng: number) {
  const dL = toRad(MECCA.lng - lng);
  const y  = Math.sin(dL);
  const x  = Math.cos(toRad(lat)) * Math.tan(toRad(MECCA.lat)) - Math.sin(toRad(lat)) * Math.cos(dL);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function getDist(lat: number, lng: number) {
  const R = 6371, dLat = toRad(MECCA.lat - lat), dLng = toRad(MECCA.lng - lng);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat)) * Math.cos(toRad(MECCA.lat)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function QiblaClient() {
  const router = useRouter();
  const prevCompass = useRef(0);

  const [qibla,    setQibla]    = useState<number | null>(null);
  const [dist,     setDist]     = useState<number | null>(null);
  const [loc,      setLoc]      = useState<{ lat: number; lng: number } | null>(null);
  const [compass,  setCompass]  = useState(0);
  const [sensorOn, setSensorOn] = useState(false);
  const [showBtn,  setShowBtn]  = useState(false);
  const [gpsReady, setGpsReady] = useState(false);
  const [gpsErr,   setGpsErr]   = useState("");

  // ── GPS ──────────────────────────────────────────────────
  useEffect(() => {
    const cached = localStorage.getItem("qibla_loc");
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached);
        setLoc({ lat, lng }); setQibla(getQibla(lat, lng)); setDist(getDist(lat, lng));
        setGpsReady(true);
      } catch {}
    }
    navigator.geolocation?.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setLoc({ lat, lng }); setQibla(getQibla(lat, lng)); setDist(getDist(lat, lng));
        localStorage.setItem("qibla_loc", JSON.stringify({ lat, lng }));
        setGpsReady(true);
        startSensor();
      },
      () => { if (!gpsReady) setGpsErr("Enable location to find Qibla."); else startSensor(); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Sensor ───────────────────────────────────────────────
  function startSensor() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      setShowBtn(true);
    } else {
      attachListener();
    }
  }

  function attachListener() {
    const handler = (e: DeviceOrientationEvent) => {
      const raw: number =
        (e as any).webkitCompassHeading != null
          ? (e as any).webkitCompassHeading
          : Math.abs((e.alpha ?? 0) - 360);
      const prev = prevCompass.current;
      let diff = raw - prev;
      if (diff >  180) diff -= 360;
      if (diff < -180) diff += 360;
      const smoothed = (prev + diff * 0.25 + 360) % 360;
      prevCompass.current = smoothed;
      setCompass(smoothed);
      setSensorOn(true);
    };
    const win = window as any;
    if ("ondeviceorientationabsolute" in window) {
      win.addEventListener("deviceorientationabsolute", handler, true);
    } else {
      win.addEventListener("deviceorientation", handler, true);
    }
  }

  async function handleIOSPermission() {
    try {
      const res = await (DeviceOrientationEvent as any).requestPermission();
      if (res === "granted") { setShowBtn(false); attachListener(); }
    } catch { setShowBtn(false); }
  }

  // Arrow angle on screen: points toward Qibla regardless of phone rotation
  const arrowAngle = qibla !== null ? (qibla - compass + 360) % 360 : 0;
  const aligned    = arrowAngle < 8 || arrowAngle > 352;

  const distLabel = dist
    ? dist > 1000 ? `${(dist / 1000).toFixed(1)}k km` : `${Math.round(dist)} km`
    : null;

  return (
    <div className="min-h-screen bg-nude-50 flex flex-col">

      {/* Header */}
      <div className="px-5 pt-12 pb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#c8705a,#d4786a 55%,#e8a090)" }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="flex items-center gap-3 mb-3 relative z-10">
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">←</button>
          <div>
            <p className="font-body text-xs text-white/70 tracking-widest uppercase">Direction</p>
            <h1 className="font-display text-2xl font-bold text-white">Qibla Finder</h1>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap relative z-10">
          {distLabel && (
            <div className="bg-white/20 rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-xs">🕋</span>
              <p className="text-white text-xs font-bold">{distLabel} to Mecca</p>
            </div>
          )}
          {loc && (
            <div className="bg-white/20 rounded-2xl px-3 py-1.5">
              <p className="text-white text-xs font-bold">📍 {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* GPS loading */}
        {!gpsReady && !gpsErr && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-nude-200 border-t-nude-500 animate-spin" />
            <p className="font-body text-nude-500 text-sm">Getting your location…</p>
          </div>
        )}

        {/* GPS error */}
        {gpsErr && !gpsReady && (
          <div className="bg-white border border-nude-200 rounded-3xl p-6 text-center w-full shadow-sm">
            <p className="text-4xl mb-3">📍</p>
            <p className="font-display text-base font-bold text-nude-700 mb-1">Location Required</p>
            <p className="font-body text-xs text-nude-400 mb-4">{gpsErr}</p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-nude-400 to-nude-500 text-white text-sm font-bold rounded-2xl">
              Try Again
            </button>
          </div>
        )}

        {gpsReady && (
          <>
            {/* ── THE ARROW ─────────────────────────────────────
                Single pointer. Rotates so it always faces Qibla.
                arrowAngle = qibla - compass
                When you face Qibla → arrowAngle = 0 → points up.
            ───────────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-3">

              {/* Outer glow circle */}
              <div className="relative flex items-center justify-center">
                {/* Pulse ring when aligned */}
                {aligned && (
                  <div className="absolute w-64 h-64 rounded-full border-4 border-green-400 animate-ping opacity-20" />
                )}

                {/* Circle background */}
                <div
                  className="w-64 h-64 rounded-full flex items-center justify-center relative"
                  style={{
                    background: aligned
                      ? "radial-gradient(circle at 40% 35%, #f0fff4, #dcfce7)"
                      : "radial-gradient(circle at 40% 35%, #fff8f6, #fde8e0)",
                    boxShadow: aligned
                      ? "0 0 48px rgba(74,222,128,0.25), 0 12px 40px rgba(0,0,0,0.08)"
                      : "0 12px 40px rgba(0,0,0,0.10), inset 0 2px 4px rgba(255,255,255,0.8)",
                    transition: "background 0.4s, box-shadow 0.4s",
                  }}
                >
                  {/* The rotating arrow */}
                  <div
                    style={{
                      transform: `rotate(${arrowAngle}deg)`,
                      transition: "transform 0.1s linear",
                      willChange: "transform",
                    }}
                  >
                    <svg width="100" height="200" viewBox="0 0 100 200" fill="none">
                      {/* Arrowhead pointing UP */}
                      <polygon
                        points="50,8 22,72 50,56 78,72"
                        fill={aligned ? "#22c55e" : "#d4786a"}
                      />
                      {/* Shaft */}
                      <rect x="44" y="56" width="12" height="96" rx="6"
                        fill={aligned ? "#86efac" : "#e8a898"}
                      />
                      {/* Tail dot */}
                      <circle cx="50" cy="168" r="10"
                        fill={aligned ? "#bbf7d0" : "#fcd5c8"}
                        stroke={aligned ? "#4ade80" : "#e8a090"}
                        strokeWidth="2"
                      />
                      {/* Kaaba at tip */}
                      <text x="50" y="44" textAnchor="middle" dominantBaseline="central" fontSize="22">🕋</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* iOS permission button */}
              {showBtn && (
                <button
                  onClick={handleIOSPermission}
                  className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
                  style={{ background: "linear-gradient(to right,#c8705a,#d4786a)" }}>
                  🧭 Allow Compass Access
                </button>
              )}

              {/* Status */}
              {aligned ? (
                <div className="flex flex-col items-center gap-1 animate-in fade-in">
                  <p className="font-display text-2xl font-black text-green-600">Facing Qibla! 🕋</p>
                  <p className="font-body text-sm text-green-500">You are aligned with the Kaaba</p>
                </div>
              ) : sensorOn ? (
                <div className="flex flex-col items-center gap-1">
                  <p className="font-display text-xl font-bold text-nude-700">
                    {Math.round(arrowAngle > 180 ? 360 - arrowAngle : arrowAngle)}°{" "}
                    <span className="font-body font-normal text-nude-500 text-base">
                      {arrowAngle > 180 ? "turn left" : "turn right"}
                    </span>
                  </p>
                  <p className="font-body text-xs text-nude-400">Rotate until the arrow points up</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="font-display text-base font-bold text-nude-600">
                    {showBtn ? "Tap Allow above to start" : "Hold phone flat to activate…"}
                  </p>
                  {!showBtn && (
                    <p className="font-body text-xs text-nude-400">Move the phone slightly if it doesn't start</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}