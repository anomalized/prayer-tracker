"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const MECCA_LAT = 21.4225;
const MECCA_LNG = 39.8262;

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function toDeg(rad: number) { return (rad * 180) / Math.PI; }

function calcQiblaAngle(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(MECCA_LAT);
  const Δλ = toRad(MECCA_LNG - lng);
  const y = Math.sin(Δλ);
  const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function calcDistance(lat: number, lng: number): number {
  const R = 6371;
  const dLat = toRad(MECCA_LAT - lat);
  const dLng = toRad(MECCA_LNG - lng);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat)) * Math.cos(toRad(MECCA_LAT)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

type Mode   = "compass" | "ar";
type Status = "idle" | "loading" | "ready" | "error";

export default function QiblaClient() {
  const router     = useRouter();
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const arAnimRef  = useRef<number>(0);
  const headingRef = useRef<number>(0); // smoothed heading

  const [mode, setMode]         = useState<Mode>("compass");
  const [status, setStatus]     = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [location, setLocation]     = useState<{ lat: number; lng: number } | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distance, setDistance]     = useState<number | null>(null);
  const [heading, setHeading]       = useState(0);
  const [arrowAngle, setArrowAngle] = useState(0);
  const [aligned, setAligned]       = useState(false);
  const [permGranted, setPermGranted] = useState(false);
  const [arStream, setArStream]     = useState<MediaStream | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [compassSource, setCompassSource] = useState<"ios" | "android-abs" | "android-rel" | "none">("none");

  // Load cached location
  useEffect(() => {
    const cached = localStorage.getItem("qibla_location");
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached);
        setLocation({ lat, lng });
        setQiblaAngle(calcQiblaAngle(lat, lng));
        setDistance(calcDistance(lat, lng));
      } catch {}
    }
    requestLocation();
  }, []);

  const requestLocation = () => {
    setStatus("loading");
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        setQiblaAngle(calcQiblaAngle(lat, lng));
        setDistance(calcDistance(lat, lng));
        localStorage.setItem("qibla_location", JSON.stringify({ lat, lng }));
        setStatus("ready");
        startCompass();
      },
      () => {
        if (location) { setStatus("ready"); startCompass(); }
        else { setStatus("error"); setErrorMsg("Could not get location. Please enable GPS and try again."); }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Smooth heading to avoid jitter
  const smoothHeading = useCallback((raw: number) => {
    const prev = headingRef.current;
    // Handle wrap-around (e.g. 359 → 1)
    let diff = raw - prev;
    if (diff > 180)  diff -= 360;
    if (diff < -180) diff += 360;
    const smoothed = (prev + diff * 0.25 + 360) % 360;
    headingRef.current = smoothed;
    return smoothed;
  }, []);

  const startCompass = useCallback(() => {
    // ── Try absolute orientation first (Android Chrome) ──────
    if ("ondeviceorientationabsolute" in window) {
      const absHandler = (e: DeviceOrientationEvent) => {
        if (e.alpha == null) return;
        const h = smoothHeading((360 - e.alpha) % 360);
        setHeading(h);
        setCompassSource("android-abs");
        setPermGranted(true);
      };
      window.addEventListener("deviceorientationabsolute" as any, absHandler, true);
      return () => window.removeEventListener("deviceorientationabsolute" as any, absHandler, true);
    }

    // ── iOS webkitCompassHeading ─────────────────────────────
    const handler = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as any).webkitCompassHeading;
      if (webkitHeading != null) {
        setHeading(smoothHeading(webkitHeading));
        setCompassSource("ios");
        setPermGranted(true);
        return;
      }
      // ── Android fallback (relative, less accurate) ───────
      if (e.alpha != null) {
        setHeading(smoothHeading((360 - e.alpha) % 360));
        setCompassSource("android-rel");
        setPermGranted(true);
      }
    };

    const w = window as any;
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      // iOS 13+ needs explicit permission
      (DeviceOrientationEvent as any).requestPermission()
        .then((res: string) => {
          if (res === "granted") {
            setPermGranted(true);
            w.addEventListener("deviceorientation", handler, true);
          }
        }).catch(() => {});
    } else {
      w.addEventListener("deviceorientation", handler, true);
    }
    return () => w.removeEventListener("deviceorientation", handler, true);
  }, [smoothHeading]);

  // Compute arrow = qibla direction relative to current heading
  useEffect(() => {
    if (qiblaAngle === null) return;
    const angle = (qiblaAngle - heading + 360) % 360;
    setArrowAngle(angle);
    setAligned(angle < 8 || angle > 352);
  }, [heading, qiblaAngle]);

  // AR camera
  const startAR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setArStream(stream);
      setMode("ar");
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch { setErrorMsg("Camera access denied."); }
  };

  const stopAR = () => {
    arStream?.getTracks().forEach(t => t.stop());
    setArStream(null);
    cancelAnimationFrame(arAnimRef.current);
    setMode("compass");
  };

  // AR canvas draw
  useEffect(() => {
    if (mode !== "ar" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d")!;
    const draw   = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx  = canvas.width / 2;
      const cy  = canvas.height / 2;
      const len = Math.min(canvas.width, canvas.height) * 0.32;
      const rad = toRad(arrowAngle - 90);
      ctx.save();
      ctx.shadowColor = aligned ? "#86efac" : "#f0c8bc";
      ctx.shadowBlur  = 30;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad)*len, cy + Math.sin(rad)*len);
      ctx.strokeStyle = aligned ? "#4ade80" : "#d4786a";
      ctx.lineWidth   = 6;
      ctx.lineCap     = "round";
      ctx.stroke();
      const tip   = { x: cx + Math.cos(rad)*len, y: cy + Math.sin(rad)*len };
      const left  = { x: tip.x + Math.cos(rad+2.5)*28, y: tip.y + Math.sin(rad+2.5)*28 };
      const right = { x: tip.x + Math.cos(rad-2.5)*28, y: tip.y + Math.sin(rad-2.5)*28 };
      ctx.beginPath(); ctx.moveTo(tip.x,tip.y); ctx.lineTo(left.x,left.y); ctx.lineTo(right.x,right.y);
      ctx.closePath(); ctx.fillStyle = aligned ? "#4ade80" : "#d4786a"; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fillStyle = "white"; ctx.fill();
      ctx.restore();
      ctx.font = "bold 16px sans-serif"; ctx.fillStyle = "white"; ctx.textAlign = "center";
      ctx.fillText(aligned ? "🕋 Facing Qibla!" : `Rotate ${Math.round(arrowAngle)}° to Qibla`, cx, cy - len - 20);
      arAnimRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(arAnimRef.current);
  }, [mode, arrowAngle, aligned]);

  const formattedDistance = distance
    ? distance > 1000 ? `${(distance/1000).toFixed(1)}k km` : `${Math.round(distance)} km`
    : null;

  const cardinal = (a: number) => ["N","NE","E","SE","S","SW","W","NW"][Math.round(a/45) % 8];

  const accuracyLabel: Record<string, string> = {
    ios: "iOS Compass ✓",
    "android-abs": "High Accuracy ✓",
    "android-rel": "Calibrate for accuracy",
    none: "Waiting for compass...",
  };

  return (
    <div className="min-h-screen bg-nude-50 flex flex-col overflow-hidden">

      {/* AR Mode */}
      {mode === "ar" && (
        <div className="fixed inset-0 z-50 bg-black">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="absolute top-0 left-0 right-0 px-5 pt-12 pb-4 flex items-center justify-between">
            <button onClick={stopAR} className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur flex items-center justify-center text-white">✕</button>
            <div className="bg-black/40 backdrop-blur rounded-2xl px-4 py-2"><p className="text-white text-sm font-bold">AR Qibla</p></div>
            <div className="w-10" />
          </div>
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <div className="bg-black/50 backdrop-blur rounded-3xl px-6 py-3 flex items-center gap-4">
              {aligned && <span className="text-green-400 text-lg animate-pulse">●</span>}
              <p className="text-white text-sm font-bold">{aligned ? "Facing Qibla 🕋" : `Rotate ${Math.round(arrowAngle)}° to Qibla`}</p>
              {formattedDistance && <p className="text-white/60 text-xs">{formattedDistance} away</p>}
            </div>
          </div>
        </div>
      )}

      {/* Compass Mode */}
      {mode === "compass" && (
        <>
          <div className="px-5 pt-12 pb-6 relative overflow-hidden"
            style={{ background: "linear-gradient(160deg, #c8705a 0%, #d4786a 50%, #e8a090 100%)" }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <button onClick={() => router.back()}
                className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold backdrop-blur">←</button>
              <div>
                <p className="font-body text-xs text-white/70 tracking-widest uppercase">Direction</p>
                <h1 className="font-display text-2xl font-bold text-white">Qibla Finder</h1>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap relative z-10">
              {formattedDistance && (
                <div className="bg-white/20 backdrop-blur rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-xs">🕋</span>
                  <p className="text-white text-xs font-bold">{formattedDistance} to Mecca</p>
                </div>
              )}
              {location && (
                <div className="bg-white/20 backdrop-blur rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-xs">📍</span>
                  <p className="text-white text-xs font-bold">{location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°</p>
                </div>
              )}
              {compassSource !== "none" && (
                <div className="bg-white/20 backdrop-blur rounded-2xl px-3 py-1.5">
                  <p className="text-white text-xs font-bold">🧭 {accuracyLabel[compassSource]}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 gap-5">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-nude-200 border-t-nude-500 animate-spin" />
                <p className="font-body text-nude-500">Getting your location...</p>
              </div>
            )}

            {status === "error" && (
              <div className="bg-white border border-nude-200 rounded-3xl p-6 text-center w-full shadow-sm">
                <p className="text-3xl mb-2">📍</p>
                <p className="font-display text-base font-bold text-nude-700 mb-1">Location Required</p>
                <p className="font-body text-xs text-nude-400 mb-4">{errorMsg}</p>
                <button onClick={requestLocation}
                  className="px-6 py-3 bg-gradient-to-r from-nude-400 to-nude-500 text-white text-sm font-bold font-body rounded-2xl">
                  Try Again
                </button>
              </div>
            )}

            {(status === "ready" || location) && (
              <>
                {/* Big compass */}
                <div className="relative flex items-center justify-center">
                  {aligned && <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-30" />}
                  <div className="relative w-72 h-72 rounded-full flex items-center justify-center"
                    style={{
                      background: "conic-gradient(from 0deg, #f5e6e0, #e8c4b8, #d4a090, #e8c4b8, #f5e6e0)",
                      boxShadow: aligned
                        ? "0 0 40px rgba(74,222,128,0.3), 0 8px 32px rgba(0,0,0,0.15)"
                        : "0 8px 32px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.5)",
                    }}>
                    {/* Cardinal labels rotate with heading */}
                    {[{label:"N",angle:0},{label:"E",angle:90},{label:"S",angle:180},{label:"W",angle:270}].map(({label,angle}) => {
                      const rad = toRad(angle - heading);
                      const r = 116;
                      return (
                        <span key={label} className={`absolute font-display text-xs font-bold ${label==="N" ? "text-nude-700" : "text-nude-500"}`}
                          style={{ left:`calc(50% + ${Math.sin(rad)*r}px - 8px)`, top:`calc(50% - ${Math.cos(rad)*r}px - 8px)`, transition:"left 0.08s, top 0.08s" }}>
                          {label}
                        </span>
                      );
                    })}

                    <div className="w-56 h-56 rounded-full flex items-center justify-center relative"
                      style={{ background: "radial-gradient(circle at 35% 35%, #fff, #f5ece8)" }}>
                      {/* Arrow rotates */}
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ transform:`rotate(${arrowAngle}deg)`, transition:"transform 0.12s ease-out" }}>
                        <svg viewBox="0 0 80 160" className="w-16 h-32" fill="none">
                          <ellipse cx="40" cy="130" rx="12" ry="16" fill="#e8c4b8" opacity="0.5" />
                          <rect x="36" y="50" width="8" height="80" rx="4" fill="url(#sg)" />
                          <path d="M40 8 L60 55 L40 45 L20 55 Z" fill={aligned ? "#4ade80" : "#d4786a"} />
                          <text x="40" y="36" textAnchor="middle" fontSize="14" fill="white">🕋</text>
                          <defs>
                            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={aligned ? "#4ade80" : "#d4786a"} />
                              <stop offset="100%" stopColor="#e8c4b8" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-nude-400 z-10 shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className={`w-full px-5 py-3 rounded-2xl flex items-center gap-3 transition-all
                  ${aligned ? "bg-green-50 border border-green-200" : "bg-white border border-nude-200 shadow-sm"}`}>
                  {aligned ? (
                    <><span className="text-xl animate-bounce">✅</span>
                    <div>
                      <p className="font-display text-base font-bold text-green-700">Facing Qibla!</p>
                      <p className="font-body text-xs text-green-500">You are aligned with the Kaaba 🕋</p>
                    </div></>
                  ) : (
                    <><div className="w-10 h-10 rounded-xl bg-nude-100 flex items-center justify-center"><span className="text-lg">🧭</span></div>
                    <div>
                      <p className="font-display text-base font-bold text-nude-700">
                        Rotate {Math.round(arrowAngle)}° {cardinal(arrowAngle)}
                      </p>
                      <p className="font-body text-xs text-nude-400">
                        Qibla is {qiblaAngle ? Math.round(qiblaAngle) : "—"}° from North
                      </p>
                    </div></>
                  )}
                </div>

                {/* iOS permission prompt */}
                {!permGranted && (
                  <button onClick={() => startCompass()}
                    className="w-full py-3 bg-nude-100 border border-nude-300 rounded-2xl text-nude-700 text-sm font-bold font-body">
                    🧭 Tap to Enable Compass
                  </button>
                )}

                {/* Calibration warning for Android relative */}
                {compassSource === "android-rel" && (
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                    <p className="font-body text-xs font-bold text-amber-700">⚠️ Compass needs calibration</p>
                    <p className="font-body text-xs text-amber-600 mt-0.5">Wave your phone in a figure-8 shape a few times for accuracy</p>
                  </div>
                )}

                <div className="w-full grid grid-cols-2 gap-3">
                  <button onClick={startAR}
                    className="py-3 rounded-2xl bg-gradient-to-r from-nude-400 to-nude-500 text-white text-sm font-bold font-body flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
                    <span>📷</span> AR Mode
                  </button>
                  <button onClick={() => { setCalibrating(true); setTimeout(() => setCalibrating(false), 1500); }}
                    className={`py-3 rounded-2xl text-sm font-bold font-body flex items-center justify-center gap-2 active:scale-95 transition-all border
                      ${calibrating ? "bg-nude-200 text-nude-600 border-nude-300" : "bg-white text-nude-600 border-nude-200"}`}>
                    {calibrating ? "✓ Done!" : "🔄 Calibrate"}
                  </button>
                </div>

                <p className="text-center text-xs text-nude-300 font-body">
                  Works offline · Last location cached automatically
                </p>
              </>
            )}

            {status === "idle" && (
              <button onClick={requestLocation}
                className="px-8 py-4 bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold font-body rounded-2xl shadow-md active:scale-95 transition-transform">
                📍 Find Qibla Direction
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}