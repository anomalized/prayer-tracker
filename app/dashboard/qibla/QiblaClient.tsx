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
  const router      = useRouter();
  const prevRef     = useRef(0);
  const alignedRef  = useRef(false);
  const qiblaRef    = useRef<number | null>(null);

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

  useEffect(() => {
    const cached = localStorage.getItem("qibla_loc");
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached);
        const q = getQibla(lat, lng);
        setLoc({ lat, lng }); setQibla(q); setDist(getDist(lat, lng));
        qiblaRef.current = q;
        setGpsReady(true);
      } catch {}
    }
    const watchId = navigator.geolocation?.watchPosition(
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
    return () => { if (watchId != null) navigator.geolocation?.clearWatch(watchId); };
  }, []);

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
    const handler = (e: DeviceOrientationEvent) => {
      let heading = 0;
      if ((e as any).webkitCompassHeading != null) {
        heading = (e as any).webkitCompassHeading;
      } else {
        heading = (360 - (e.alpha ?? 0)) % 360;
      }
      const prev = prevRef.current;
      let diff = heading - prev;
      if (diff >  180) diff -= 360;
      if (diff < -180) diff += 360;
      const smoothed = (prev + diff * 0.15 + 360) % 360;
      prevRef.current = smoothed;
      setCompass(smoothed);
      setLive(true);

      setIsFlat(Math.abs(e.beta ?? 0) < 25 && Math.abs(e.gamma ?? 0) < 25);

      if (qiblaRef.current !== null) {
        const angle = (qiblaRef.current - smoothed + 360) % 360;
        const nowAligned = angle < 4 || angle > 356;
        if (nowAligned && !alignedRef.current && navigator.vibrate) {
          navigator.vibrate(45);
        }
        alignedRef.current = nowAligned;
      }
    };

    const win = window as any;
    const eventName = "ondeviceorientationabsolute" in window
      ? "deviceorientationabsolute"
      : "deviceorientation";
    win.addEventListener(eventName, handler, true);
  }

  const arrowAngle = qibla !== null ? (qibla - compass + 360) % 360 : 0;
  const aligned    = arrowAngle < 8 || arrowAngle > 352;
  const absDeg     = arrowAngle > 180 ? 360 - arrowAngle : arrowAngle;
  const dir        = arrowAngle > 180 ? "left" : "right";

  return (
    <div className="min-h-screen flex flex-col select-none" style={{ background: "#fdf6f3" }}>

      {/* Calibration Overlay */}
      {calibrating && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-3xl">🔄</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Calibrating Sensors</h2>
          <p className="text-white/80 text-sm mb-6">
            Move your phone in a large <span className="text-white font-bold">figure-8 motion</span> to improve accuracy.
          </p>
          <button onClick={() => setCalibrating(false)}
            className="px-8 py-3 bg-white text-black font-bold rounded-2xl text-sm">
            Done
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-12 pb-5 relative overflow-hidden text-white"
        style={{ background: "linear-gradient(160deg,#c8705a,#d4786a 55%,#e8a090)" }}>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] opacity-70 tracking-widest uppercase font-bold">Qibla Direction</p>
          <h1 className="text-2xl font-bold tracking-tight">Mecca Finder</h1>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {dist && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap">
              🕋 {Math.round(dist)} km to Kaaba
            </div>
          )}
          {loc && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap">
              📍 {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
        {gpsReady ? (
          <>
            <div className="relative flex items-center justify-center">
              {aligned && (
                <div className="absolute w-80 h-80 rounded-full border-2 border-green-500/30 animate-ping" />
              )}

              {/* Compass plate */}
              <div
                className="w-72 h-72 rounded-full relative flex items-center justify-center shadow-2xl transition-all duration-500"
                style={{
                  background: aligned
                    ? "radial-gradient(circle, #f0fff4, #dcfce7)"
                    : "radial-gradient(circle, #ffffff, #fef2ee)",
                  boxShadow: aligned
                    ? "0 20px 50px -12px rgba(34,197,94,0.3)"
                    : "0 20px 50px -12px rgba(200,112,90,0.15)",
                }}
              >
                {/* Subtle tick ring */}
                <svg className="absolute inset-0 w-full h-full p-4 opacity-20" viewBox="0 0 100 100">
                  {[...Array(36)].map((_, i) => (
                    <line key={i} x1="50" y1="5" x2="50" y2={i % 9 === 0 ? "12" : "8"}
                      stroke="currentColor"
                      strokeWidth={i % 9 === 0 ? "1.5" : "0.5"}
                      transform={`rotate(${i * 10} 50 50)`} />
                  ))}
                </svg>

                {/* Rotating needle */}
                <div
                  className="w-full h-full relative will-change-transform"
                  style={{
                    transform: `rotate(${arrowAngle}deg) scale(${aligned ? 1.05 : 1})`,
                    filter: aligned ? "drop-shadow(0 0 8px rgba(34,197,94,0.4))" : "none",
                    transition: "transform 0.15s linear, filter 0.3s ease",
                  }}
                >
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <span className="text-3xl mb-1">🕋</span>
                    <div
                      className="w-1.5 h-32 rounded-full"
                      style={{
                        background: aligned
                          ? "linear-gradient(to bottom, #22c55e, transparent)"
                          : "linear-gradient(to bottom, #c8705a, transparent)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Info cards */}
            <div className="w-full space-y-3 max-w-sm">
              {!isFlat && live && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center gap-3">
                  <span className="text-lg">📐</span>
                  <p className="text-[11px] font-bold text-amber-800">
                    Tilt detected. Hold phone flat for accuracy.
                  </p>
                </div>
              )}

              <div className={`p-5 rounded-[2.5rem] border transition-all duration-300 shadow-sm flex items-center gap-4
                ${aligned ? "bg-green-50 border-green-100" : "bg-white border-nude-100"}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner flex-shrink-0
                  ${aligned ? "bg-green-100 text-green-600" : "bg-orange-50 text-orange-400"}`}>
                  {aligned ? "✓" : "🧭"}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${aligned ? "text-green-800" : "text-slate-800"}`}>
                    {aligned
                      ? "Qibla Aligned"
                      : live
                        ? `Turn ${Math.round(absDeg)}° to the ${dir}`
                        : "Waiting for compass…"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {aligned
                      ? "You are now facing the Kaaba"
                      : live
                        ? "Rotate slowly until the arrow turns green"
                        : "Hold phone flat and move slightly"}
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

      {/* iOS compass permission button */}
      {showBtn && (
        <div className="p-6">
          <button
            onClick={() => {
              (DeviceOrientationEvent as any).requestPermission().then((r: string) => {
                if (r === "granted") { setShowBtn(false); wire(); }
              });
            }}
            className="w-full py-4 bg-gradient-to-r from-nude-400 to-nude-500 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-transform">
            🧭 Enable Compass Access
          </button>
        </div>
      )}
    </div>
  );
}