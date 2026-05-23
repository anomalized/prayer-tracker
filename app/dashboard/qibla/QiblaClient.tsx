"use client";

import { useState, useEffect, useRef } from "react";
import MenuButton from "@/components/ui/MenuButton";

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
  const a = Math.sin(toRad(MECCA.lat - lat)/2)**2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(MECCA.lat)) *
    Math.sin(toRad(MECCA.lng - lng)/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function QiblaClient() {
  const [isDesktop, setIsDesktop] = useState(false);
  const prevRef    = useRef(0);
  const alignedRef = useRef(false);
  const qiblaRef   = useRef<number | null>(null);
  const handlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const eventRef   = useRef<string>("deviceorientation");

  const [qibla,       setQibla]       = useState<number | null>(null);
  const [dist,        setDist]        = useState<number | null>(null);
  const [loc,         setLoc]         = useState<{ lat: number; lng: number } | null>(null);
  const [compass,     setCompass]     = useState(0);
  const [live,        setLive]        = useState(false);
  const [showBtn,     setShowBtn]     = useState(false);
  const [gpsReady,    setGpsReady]    = useState(false);
  const [gpsErr,      setGpsErr]      = useState("");
  const [calibrating, setCalibrating] = useState(false);
  const [isFlat,      setIsFlat]      = useState(true);
  // dynamic = compass follows phone rotation in real time (like your mum's Quran app)
  // static  = arrow just points to fixed Qibla bearing on screen
  const [dynamic, setDynamic] = useState(false);

  // ── GPS ──────────────────────────────────────────────────────
  useEffect(() => {
    const cached = localStorage.getItem("qibla_loc");
    if (cached) {
      try {
        const noTouch = !('ontouchstart' in window) && navigator.maxTouchPoints === 0;
        if (noTouch) {
          setIsDesktop(true);
          // Still get GPS for static bearing display
        }
        const { lat, lng } = JSON.parse(cached);
        const q = getQibla(lat, lng);
        setLoc({ lat, lng }); setQibla(q); setDist(getDist(lat, lng));
        qiblaRef.current = q;
        setGpsReady(true);
      } catch {}
    }
    const wid = navigator.geolocation?.watchPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        const q = getQibla(lat, lng);
        setLoc({ lat, lng }); setQibla(q); setDist(getDist(lat, lng));
        qiblaRef.current = q;
        localStorage.setItem("qibla_loc", JSON.stringify({ lat, lng }));
        setGpsReady(prev => { if (!prev) initSensor(); return true; });
      },
      () => { if (!gpsReady) setGpsErr("Please enable location access."); },
      { enableHighAccuracy: true }
    );
    return () => { if (wid != null) navigator.geolocation?.clearWatch(wid); };
  }, []);

  // ── Sensor init ──────────────────────────────────────────────
  function initSensor() {
    if (isDesktop) return; // Desktop has no DeviceOrientation — show static mode only
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      setShowBtn(true);
    } else {
      wireAndEnable();
    }
  }

  // Wire up the sensor AND switch to dynamic mode
  function wireAndEnable() {
    // Always clean up previous listener first
    if (handlerRef.current) {
      (window as any).removeEventListener(eventRef.current, handlerRef.current, true);
    }

    const handler = (e: DeviceOrientationEvent) => {
      let heading = 0;

      if ((e as any).webkitCompassHeading != null) {
        // ── iOS: webkitCompassHeading is already true-North bearing ──
        heading = (e as any).webkitCompassHeading;
      } else if (e.alpha != null) {
        // ── Android ──────────────────────────────────────────────────
        // deviceorientationabsolute gives alpha = clockwise from true North
        // Regular deviceorientation gives alpha relative to arbitrary start
        // Both: convert to compass bearing with (360 - alpha) % 360
        heading = (360 - e.alpha) % 360;
      } else {
        return; // no data, skip
      }

      // Low-pass smoothing to kill jitter
      const prev = prevRef.current;
      let diff = heading - prev;
      if (diff >  180) diff -= 360;
      if (diff < -180) diff += 360;
      const smoothed = (prev + diff * 0.15 + 360) % 360;
      prevRef.current = smoothed;
      setCompass(smoothed);
      setLive(true);

      // Tilt detection
      setIsFlat(Math.abs(e.beta ?? 0) < 25 && Math.abs(e.gamma ?? 0) < 25);

      // Haptic on alignment
      if (qiblaRef.current !== null) {
        const angle = (qiblaRef.current - smoothed + 360) % 360;
        const nowAligned = angle < 4 || angle > 356;
        if (nowAligned && !alignedRef.current && navigator.vibrate) {
          navigator.vibrate(45);
        }
        alignedRef.current = nowAligned;
      }
    };

    // Android Chrome: prefer deviceorientationabsolute (true North guaranteed)
    // If not available, plain deviceorientation still works — just needs calibration
    const eventName = "ondeviceorientationabsolute" in window
      ? "deviceorientationabsolute"
      : "deviceorientation";

    eventRef.current = eventName;
    handlerRef.current = handler;
    (window as any).addEventListener(eventName, handler, true);
    setDynamic(true);
  }

  function disableDynamic() {
    if (handlerRef.current) {
      (window as any).removeEventListener(eventRef.current, handlerRef.current, true);
      handlerRef.current = null;
    }
    setDynamic(false);
    setLive(false);
  }

  async function handleIOSPermission() {
    try {
      const r = await (DeviceOrientationEvent as any).requestPermission();
      if (r === "granted") { setShowBtn(false); wireAndEnable(); }
    } catch { setShowBtn(false); }
  }

  // ── Arrow angle ──────────────────────────────────────────────
  // In dynamic mode: arrowAngle = qibla - compass (rotates with phone)
  // In static mode:  arrowAngle = qibla (fixed to screen, just shows bearing)
  const arrowAngle = qibla !== null
    ? dynamic
      ? (qibla - compass + 360) % 360   // live — tracks real world
      : qibla                            // static — fixed compass bearing
    : 0;

  const aligned = (arrowAngle % 360) < 8 || (arrowAngle % 360) > 352;
  const absDeg  = arrowAngle > 180 ? 360 - arrowAngle : arrowAngle;
  const dir     = arrowAngle > 180 ? "left" : "right";

  const distLabel = dist
    ? dist > 1000 ? `${(dist / 1000).toFixed(1)}k km` : `${Math.round(dist)} km`
    : null;

  return (
    <div className="min-h-screen md:pb-8 flex flex-col select-none" style={{ background: "var(--color-bg-primary)" }}>

      {/* Calibration overlay */}
      {calibrating && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-3xl">🔄</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Calibrating Sensors</h2>
          <p className="text-white/80 text-sm mb-6">
            Move your phone in a large <span className="text-white font-bold">figure-8 motion</span> a few times.
          </p>
          <button onClick={() => setCalibrating(false)}
            className="px-8 py-3 bg-theme-surface text-black font-bold rounded-2xl text-sm">
            Done
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-12  md:pt-6 pb-5 relative overflow-hidden text-white"
        style={{ background: "var(--btn-gradient)" }}>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] opacity-70 tracking-widest uppercase font-bold">Qibla Direction</p>
          <h1 className="text-2xl font-bold tracking-tight">Mecca Finder</h1>
        </div>
        <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={true} />
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {distLabel && (
            <div className="bg-theme-surface/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap">
              🕋 {distLabel} to Kaaba
            </div>
          )}
          {loc && (
            <div className="bg-theme-surface/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap">
              📍 {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°
            </div>
          )}
          {qibla !== null && (
            <div className="bg-theme-surface/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap">
              Qibla {Math.round(qibla)}° from N
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 gap-6">
        {gpsReady ? (
          <>
            {/* ── DYNAMIC / STATIC TOGGLE ── */}
            { !isDesktop && (
              <div className="flex items-center gap-3 bg-theme-surface border border-theme-border rounded-2xl px-4 py-3 w-full max-w-sm shadow-sm">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">
                    {dynamic ? "🧭 Dynamic Mode" : "📌 Static Mode"}
                  </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {dynamic
                    ? "Arrow follows your phone rotation"
                    : "Arrow shows fixed Qibla bearing"}
                </p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => dynamic ? disableDynamic() : (showBtn ? null : wireAndEnable())}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0
                  ${dynamic ? "bg-green-500" : "bg-slate-200"}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-theme-surface rounded-full shadow transition-all duration-300
                  ${dynamic ? "left-7" : "left-0.5"}`} />
              </button>
            </div>
            )}

            {/* iOS permission prompt — replaces toggle action */}
            {showBtn && !dynamic && (
              <button onClick={handleIOSPermission}
                className="w-full max-w-sm py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "var(--btn-gradient)" }}>
                🧭 Allow Compass to Enable Dynamic Mode
              </button>
            )}

            {/* Compass circle */}
            <div className="relative flex items-center justify-center">
              {aligned && dynamic && (
                <div className="absolute w-80 h-80 rounded-full border-2 border-green-500/30 animate-ping" />
              )}

              <div
                className="w-72 h-72 rounded-full relative flex items-center justify-center shadow-2xl transition-all duration-500"
                style={{
                  background: (aligned && dynamic)
                    ? "radial-gradient(circle, #f0fff4, #dcfce7)"
                    : "radial-gradient(circle, #ffffff, #fef2ee)",
                  boxShadow: (aligned && dynamic)
                    ? "0 20px 50px -12px rgba(34,197,94,0.3)"
                    : "0 20px 50px -12px rgba(212,120,106,0.15)",
                }}
              >
                {/* Tick ring */}
                <svg className="absolute inset-0 w-full h-full p-4 opacity-20" viewBox="0 0 100 100">
                  {[...Array(36)].map((_, i) => (
                    <line key={i} x1="50" y1="5" x2="50" y2={i % 9 === 0 ? "12" : "8"}
                      stroke="currentColor"
                      strokeWidth={i % 9 === 0 ? "1.5" : "0.5"}
                      transform={`rotate(${i * 10} 50 50)`} />
                  ))}
                </svg>

                {/* Needle */}
                <div
                  className="w-full h-full relative will-change-transform"
                  style={{
                    transform: `rotate(${arrowAngle}deg) scale(${aligned && dynamic ? 1.05 : 1})`,
                    filter: (aligned && dynamic) ? "drop-shadow(0 0 8px rgba(34,197,94,0.4))" : "none",
                    transition: dynamic && live
                      ? "transform 0.15s linear, filter 0.3s ease"
                      : "transform 0.5s ease, filter 0.3s ease",
                  }}
                >
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <span className="text-3xl mb-1">🕋</span>
                    <div
                      className="w-1.5 h-32 rounded-full"
                      style={{
                        background: (aligned && dynamic)
                          ? "linear-gradient(to bottom, #22c55e, transparent)"
                          : "linear-gradient(to bottom, var(--color-accent), transparent)",
                      }}
                    />
                  </div>
                </div>

                {isDesktop && (
                  <div className="w-full max-w-sm bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">💻</span>
                    <div>
                      <p className="font-body text-sm font-bold text-amber-800">Compass unavailable on desktop</p>
                      <p className="font-body text-xs text-amber-600 mt-0.5">
                        The live compass requires a mobile device with a magnetometer.
                        The arrow below shows your static Qibla bearing from your current location.
                      </p>
                    </div>
                  </div>
                )}
                {!dynamic && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                    <span className="text-[10px] font-bold text-slate-400 bg-theme-surface/80 px-2 py-0.5 rounded-full">
                      Static — enable dynamic for live tracking
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status cards */}
            <div className="w-full space-y-3 max-w-sm">
              {/* Tilt warning */}
              {!isFlat && live && dynamic && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center gap-3">
                  <span className="text-lg">📐</span>
                  <p className="text-[11px] font-bold text-amber-800">
                    Tilt detected — hold phone flat for accuracy
                  </p>
                </div>
              )}

              {/* Direction card */}
              <div className={`p-5 rounded-[2.5rem] border transition-all duration-300 shadow-sm flex items-center gap-4
                ${aligned && dynamic ? "bg-green-50 border-green-100" : "bg-theme-surface border-theme-border"}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner flex-shrink-0
                  ${aligned && dynamic ? "bg-green-100 text-green-600" : "bg-orange-50 text-orange-400"}`}>
                  {aligned && dynamic ? "✓" : "🧭"}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${aligned && dynamic ? "text-green-800" : "text-slate-800"}`}>
                    {!dynamic
                      ? `Qibla is ${Math.round(qibla ?? 0)}° from North`
                      : isDesktop
                        ? `Qibla bearing: ${Math.round(qibla ?? 0)}° — open on mobile for live compass`
                        : aligned
                          ? "Qibla Aligned!"
                          : live
                            ? `Turn ${Math.round(absDeg)}° to the ${dir}`
                            : "Sensor starting up…"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {!dynamic
                      ? "Turn on Dynamic Mode for live compass"
                      : isDesktop
                        ? "Open on mobile for live compass"
                        : aligned
                        ? "You are now facing the Kaaba 🕋"
                        : live
                          ? "Rotate until the arrow turns green"
                          : "Move phone slightly to activate"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCalibrating(true)}
                className="w-full py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                Reset & Calibrate Sensors
              </button>
            </div>
          </>
        ) : gpsErr ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-4xl">📍</p>
            <p className="text-sm font-bold text-slate-700">Location Required</p>
            <p className="text-xs text-slate-400 mb-2">{gpsErr}</p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-nude-400 to-nude-500 text-white text-sm font-bold rounded-2xl">
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-[#c8705a]/20 border-t-[#c8705a] rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Establishing GPS Connection…</p>
          </div>
        )}
      </div>
    </div>
  );
}