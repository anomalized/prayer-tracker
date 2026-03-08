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
  const R = 6371;
  const dLat = toRad(MECCA.lat - lat);
  const dLng = toRad(MECCA.lng - lng);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat)) * Math.cos(toRad(MECCA.lat)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function QiblaClient() {
  const router = useRouter();
  const prevRef = useRef(0);

  const [qibla,    setQibla]    = useState<number | null>(null);
  const [dist,     setDist]     = useState<number | null>(null);
  const [loc,      setLoc]      = useState<{ lat: number; lng: number } | null>(null);
  const [compass,  setCompass]  = useState(0);
  const [live,     setLive]     = useState(false);   // sensor is firing
  const [showBtn,  setShowBtn]  = useState(false);   // iOS needs tap
  const [gpsReady, setGpsReady] = useState(false);
  const [gpsErr,   setGpsErr]   = useState("");
  const [confirmed, setConfirmed] = useState(false); // user tapped "confirm"
  const [calibMsg, setCalibMsg] = useState(false);

  // ── GPS ──────────────────────────────────────────────────────
  useEffect(() => {
    const cached = localStorage.getItem("qibla_loc");
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached);
        setLoc({ lat, lng }); setQibla(getQibla(lat, lng)); setDist(getDist(lat, lng));
        setGpsReady(true);
      } catch {}
    }
    // watchPosition keeps Qibla angle accurate if user is moving (car, train, etc.)
    const watchId = navigator.geolocation?.watchPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setLoc({ lat, lng }); setQibla(getQibla(lat, lng)); setDist(getDist(lat, lng));
        localStorage.setItem("qibla_loc", JSON.stringify({ lat, lng }));
        setGpsReady(prev => { if (!prev) initSensor(); return true; });
      },
      () => {
        if (gpsReady) initSensor();
        else setGpsErr("Enable location access to find your Qibla direction.");
      },
      { enableHighAccuracy: true }
    );
    return () => { if (watchId != null) navigator.geolocation?.clearWatch(watchId); };
  }, []);

  // ── Sensor ───────────────────────────────────────────────────
  function initSensor() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      setShowBtn(true);
    } else {
      wire();
    }
  }

  function wire() {
    // Exact formula used by iQibla, Muslim & Quran, and other top apps:
    // compass = webkitCompassHeading  (iOS — true North already)
    //         || Math.abs(alpha - 360) (Android — converts to bearing)
    const handler = (e: DeviceOrientationEvent) => {
      let heading = 0;
      if ((e as any).webkitCompassHeading != null) {
        heading = (e as any).webkitCompassHeading; // iOS — already true North
      } else {
        heading = (360 - (e.alpha ?? 0)) % 360;    // Android absolute
      }
      // Low-pass smoothing (0.2 factor) — kills sensor noise without lag
      const prev = prevRef.current;
      let diff = heading - prev;
      if (diff >  180) diff -= 360;
      if (diff < -180) diff += 360;
      const smoothed = (prev + diff * 0.2 + 360) % 360;
      prevRef.current = smoothed;
      setCompass(smoothed);
      setLive(true);
    };

    const win = window as any;
    if ("ondeviceorientationabsolute" in window) {
      win.addEventListener("deviceorientationabsolute", handler, true);
    } else {
      win.addEventListener("deviceorientation", handler, true);
    }
  }

  async function allowCompass() {
    try {
      const r = await (DeviceOrientationEvent as any).requestPermission();
      if (r === "granted") { setShowBtn(false); wire(); }
    } catch { setShowBtn(false); }
  }

  // ── Derived ──────────────────────────────────────────────────
  // The one number that matters:
  //   arrowAngle = qibla - compass
  // When you face Qibla → compass ≈ qibla → arrowAngle ≈ 0 → arrow points UP
  const arrowAngle = qibla !== null ? (qibla - compass + 360) % 360 : 0;
  const aligned = arrowAngle < 8 || arrowAngle > 352;

  // How many degrees to turn, and which way
  const absDeg = arrowAngle > 180 ? 360 - arrowAngle : arrowAngle;
  const dir    = arrowAngle > 180 ? "left" : "right";

  const distLabel = dist
    ? dist > 1000 ? `${(dist / 1000).toFixed(1)}k km` : `${Math.round(dist)} km`
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fdf6f3" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-5 pt-12 pb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#c8705a,#d4786a 55%,#e8a090)" }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="flex items-center gap-3 mb-3 relative z-10">
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            ←
          </button>
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
              <p className="text-white text-xs font-bold">
                📍 {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°
              </p>
            </div>
          )}
          {qibla !== null && (
            <div className="bg-white/20 rounded-2xl px-3 py-1.5">
              <p className="text-white text-xs font-bold">Qibla {Math.round(qibla)}° from N</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 py-6">

        {/* Loading */}
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
            {/* ══════════════════════════════════════════════
                QIBLA ARROW
                Just one SVG needle that rotates continuously.
                arrowAngle = qibla - compass
                Hold phone flat → rotate body → needle aligns up → you face Qibla.
            ══════════════════════════════════════════════ */}
            <div className="relative flex items-center justify-center">

              {/* Outer glow on alignment */}
              {aligned && (
                <div className="absolute w-72 h-72 rounded-full animate-ping opacity-20 pointer-events-none"
                  style={{ border: "4px solid #22c55e" }} />
              )}

              {/* Background circle */}
              <div
                className="w-72 h-72 rounded-full relative flex items-center justify-center overflow-hidden"
                style={{
                  background: aligned
                    ? "radial-gradient(circle at 40% 35%, #f0fff4 0%, #dcfce7 100%)"
                    : "radial-gradient(circle at 40% 35%, #ffffff 0%, #fde8df 100%)",
                  boxShadow: aligned
                    ? "0 0 56px rgba(34,197,94,0.2), 0 16px 48px rgba(0,0,0,0.08)"
                    : "0 16px 48px rgba(0,0,0,0.1), inset 0 2px 6px rgba(255,255,255,0.9)",
                  transition: "background 0.5s ease, box-shadow 0.5s ease",
                }}
              >
                {/* Subtle degree ring */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 288">
                  {Array.from({ length: 36 }).map((_, i) => {
                    const a = i * 10;
                    const rad = toRad(a - 90);
                    const r1 = 136, r2 = a % 90 === 0 ? 122 : a % 30 === 0 ? 126 : 130;
                    return (
                      <line key={i}
                        x1={144 + r1 * Math.cos(rad)} y1={144 + r1 * Math.sin(rad)}
                        x2={144 + r2 * Math.cos(rad)} y2={144 + r2 * Math.sin(rad)}
                        stroke={aligned ? "#86efac" : "#e8c4b4"}
                        strokeWidth={a % 90 === 0 ? 2 : 1}
                        strokeLinecap="round"
                        opacity="0.6"
                      />
                    );
                  })}
                  {/* Top marker — "you are here" */}
                  <polygon points="144,6 138,18 150,18"
                    fill={aligned ? "#22c55e" : "#d4786a"}
                    opacity="0.7" />
                </svg>

                {/* THE NEEDLE — rotates smoothly */}
                <div
                  className="transition-transform duration-100 ease-linear will-change-transform"
                  style={{ transform: `rotate(${arrowAngle}deg)` }}
                >
                  <svg width="88" height="200" viewBox="0 0 88 200" fill="none">
                    {/* Kaaba at tip */}
                    <text x="44" y="22" textAnchor="middle" dominantBaseline="central" fontSize="26">🕋</text>

                    {/* Upper needle (points to Qibla) */}
                    <path
                      d="M44 36 L56 90 L44 82 L32 90 Z"
                      fill={aligned ? "#22c55e" : "#c8705a"}
                    />
                    <rect x="40" y="82" width="8" height="30" rx="4"
                      fill={aligned ? "#4ade80" : "#d4786a"} />

                    {/* Center circle */}
                    <circle cx="44" cy="116" r="10"
                      fill={aligned ? "#dcfce7" : "#fde8df"}
                      stroke={aligned ? "#22c55e" : "#d4786a"}
                      strokeWidth="2.5" />

                    {/* Lower tail */}
                    <rect x="40" y="126" width="8" height="30" rx="4"
                      fill={aligned ? "#86efac" : "#e8b0a0"} />
                    <path
                      d="M44 164 L54 148 L44 154 L34 148 Z"
                      fill={aligned ? "#86efac" : "#e8c4b4"}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* iOS permission */}
            {showBtn && (
              <button onClick={allowCompass}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
                style={{ background: "linear-gradient(to right, #c8705a, #d4786a)" }}>
                🧭 Allow Compass Access
              </button>
            )}

            {/* Status */}
            {confirmed ? (
              /* Confirmed state */
              <div className="w-full bg-green-50 border border-green-200 rounded-3xl px-5 py-4 flex flex-col items-center gap-2 text-center">
                <span className="text-4xl">✅</span>
                <p className="font-display text-lg font-bold text-green-700">Qibla Confirmed!</p>
                <p className="font-body text-sm text-green-600">
                  You are facing the direction of the Kaaba 🕋
                </p>
                <button
                  onClick={() => setConfirmed(false)}
                  className="mt-2 px-5 py-2 rounded-2xl bg-green-100 border border-green-200 text-green-700 text-xs font-bold font-body"
                >
                  Check Again
                </button>
              </div>
            ) : aligned ? (
              /* Aligned — prompt to confirm */
              <div className="w-full flex flex-col items-center gap-3">
                <div className="w-full bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl animate-bounce">🕋</span>
                  <div>
                    <p className="font-display text-base font-bold text-green-700">Arrow pointing to Qibla!</p>
                    <p className="font-body text-xs text-green-500">Hold still and tap confirm</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmed(true)}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
                  style={{ background: "linear-gradient(to right, #16a34a, #22c55e)" }}>
                  ✅ Confirm Qibla Direction
                </button>
              </div>
            ) : live ? (
              /* Live — rotating guidance */
              <div className="w-full bg-white border border-nude-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
                <span className="text-2xl">🧭</span>
                <div>
                  <p className="font-display text-sm font-bold text-nude-700">
                    Rotate <span style={{ color: "#c8705a" }}>{Math.round(absDeg)}°</span> to the {dir}
                  </p>
                  <p className="font-body text-xs text-nude-400">
                    Until the 🕋 arrow points straight up
                  </p>
                </div>
              </div>
            ) : (
              /* Waiting for sensor */
              <div className="w-full bg-white border border-nude-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-display text-sm font-bold text-nude-700">
                    {showBtn ? "Tap Allow above to start" : "Hold phone flat to activate"}
                  </p>
                  <p className="font-body text-xs text-nude-400">
                    Keep away from metal objects for accuracy
                  </p>
                </div>
              </div>
            )}

            {/* Calibrate */}
            {live && !confirmed && (
              <button
                onClick={() => { setCalibMsg(true); setTimeout(() => setCalibMsg(false), 3500); }}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold font-body border transition-all active:scale-95
                  ${calibMsg
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-white border-nude-200 text-nude-400"}`}
              >
                {calibMsg ? "✦ Move phone slowly in a figure-8 now" : "🔄 Arrow drifting? Tap to calibrate"}
              </button>
            )}

            <p className="text-center text-xs text-nude-300 font-body">
              Works offline · Location cached automatically
            </p>
          </>
        )}
      </div>
    </div>
  );
}