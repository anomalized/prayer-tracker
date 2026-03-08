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
  const router    = useRouter();
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arAnimRef = useRef<number>(0);
  const prevHeadingRef = useRef<number>(0);

  const [mode, setMode]       = useState<Mode>("compass");
  const [status, setStatus]   = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [location, setLocation]     = useState<{ lat: number; lng: number } | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distance, setDistance]     = useState<number | null>(null);
  const [heading, setHeading]       = useState(0);
  const [aligned, setAligned]       = useState(false);
  const [hasCompass, setHasCompass] = useState(false);
  const [compassSource, setCompassSource] = useState<string>("none");
  const [arStream, setArStream]     = useState<MediaStream | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  // ── Load cached location ─────────────────────────────────────
  useEffect(() => {
    const cached = localStorage.getItem("qibla_location");
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached);
        setLocation({ lat, lng });
        setQiblaAngle(calcQiblaAngle(lat, lng));
        setDistance(calcDistance(lat, lng));
        setStatus("ready");
      } catch {}
    }
    requestLocation();
  }, []);

  // ── GPS ──────────────────────────────────────────────────────
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation not supported.");
      return;
    }
    if (status !== "ready") setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        setQiblaAngle(calcQiblaAngle(lat, lng));
        setDistance(calcDistance(lat, lng));
        localStorage.setItem("qibla_location", JSON.stringify({ lat, lng }));
        setStatus("ready");
        attachCompass();
      },
      () => {
        if (location) { setStatus("ready"); attachCompass(); }
        else { setStatus("error"); setErrorMsg("Could not get location. Enable GPS and try again."); }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Smooth heading (exponential low-pass filter) ─────────────
  const smoothHeading = useCallback((raw: number) => {
    const prev = prevHeadingRef.current;
    let diff = raw - prev;
    if (diff > 180)  diff -= 360;
    if (diff < -180) diff += 360;
    const smoothed = (prev + diff * 0.3 + 360) % 360;
    prevHeadingRef.current = smoothed;
    return smoothed;
  }, []);

  // ── Attach compass sensor ────────────────────────────────────
  const attachCompass = useCallback(() => {
    // Android Chrome: absolute orientation event (best accuracy)
    const win = window as any;
    if ("ondeviceorientationabsolute" in window) {
      win.addEventListener("deviceorientationabsolute", (e: DeviceOrientationEvent) => {
        if (e.alpha == null) return;
        setHeading(smoothHeading((360 - e.alpha) % 360));
        setHasCompass(true);
        setCompassSource("android-abs");
      }, true);
      return;
    }

    // iOS / generic deviceorientation
    const handler = (e: DeviceOrientationEvent) => {
      const webkit = (e as any).webkitCompassHeading;
      if (webkit != null) {
        setHeading(smoothHeading(webkit));
        setHasCompass(true);
        setCompassSource("ios");
      } else if (e.alpha != null) {
        setHeading(smoothHeading((360 - e.alpha) % 360));
        setHasCompass(true);
        setCompassSource("android-rel");
      }
    };

    // iOS 13+ requires permission via user gesture
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      setNeedsPermission(true);
      return;
    }

    win.addEventListener("deviceorientation", handler, true);
  }, [smoothHeading]);

  // ── iOS permission request (must be called from user gesture) ─
  const requestCompassPermission = async () => {
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === "granted") {
        setNeedsPermission(false);
        const win = window as any;
        win.addEventListener("deviceorientation", (e: DeviceOrientationEvent) => {
          const webkit = (e as any).webkitCompassHeading;
          if (webkit != null) {
            setHeading(smoothHeading(webkit));
            setHasCompass(true);
            setCompassSource("ios");
          }
        }, true);
      }
    } catch (err) {
      setNeedsPermission(false);
    }
  };

  // ── Alignment check ──────────────────────────────────────────
  useEffect(() => {
    if (qiblaAngle === null) return;
    const diff = Math.abs(((heading - qiblaAngle) + 360) % 360);
    setAligned(diff < 8 || diff > 352);
  }, [heading, qiblaAngle]);

  // ── AR Mode ──────────────────────────────────────────────────
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

  useEffect(() => {
    if (mode !== "ar" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const draw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const len = Math.min(canvas.width, canvas.height) * 0.32;
      const arAngle = qiblaAngle !== null ? (qiblaAngle - heading + 360) % 360 : 0;
      const rad = toRad(arAngle - 90);
      ctx.save();
      ctx.shadowColor = aligned ? "#86efac" : "#f0c8bc";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad)*len, cy + Math.sin(rad)*len);
      ctx.strokeStyle = aligned ? "#4ade80" : "#d4786a";
      ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke();
      const tip = { x: cx + Math.cos(rad)*len, y: cy + Math.sin(rad)*len };
      const l = { x: tip.x + Math.cos(rad+2.5)*24, y: tip.y + Math.sin(rad+2.5)*24 };
      const r = { x: tip.x + Math.cos(rad-2.5)*24, y: tip.y + Math.sin(rad-2.5)*24 };
      ctx.beginPath(); ctx.moveTo(tip.x,tip.y); ctx.lineTo(l.x,l.y); ctx.lineTo(r.x,r.y);
      ctx.closePath(); ctx.fillStyle = aligned ? "#4ade80" : "#d4786a"; ctx.fill();
      ctx.restore();
      ctx.font = "bold 15px sans-serif"; ctx.fillStyle = "white"; ctx.textAlign = "center";
      ctx.fillText(aligned ? "🕋 Facing Qibla!" : `Turn ${Math.round(arAngle)}° to Qibla`, cx, cy - len - 16);
      arAnimRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(arAnimRef.current);
  }, [mode, heading, qiblaAngle, aligned]);

  // ── Display helpers ──────────────────────────────────────────
  const dist = distance
    ? distance > 1000 ? `${(distance/1000).toFixed(1)}k km` : `${Math.round(distance)} km`
    : null;

  // Degrees to rotate from current heading to reach Qibla (signed, shortest path)
  const degsToQibla = qiblaAngle !== null
    ? (() => { const d = ((qiblaAngle - heading) + 360) % 360; return d > 180 ? d - 360 : d; })()
    : 0;

  const cardinalFull = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  const headingLabel = cardinalFull[Math.round(heading / 22.5) % 16];

  // ── SVG compass parameters ───────────────────────────────────
  // The entire compass SVG rotates by -heading
  // The Qibla arrow group inside it is placed at qiblaAngle from North
  const CX = 160, CY = 160, R_OUTER = 148, R_INNER = 100;
  const dialRotDeg  = -heading;
  const qiblaDeg    = qiblaAngle ?? 0;

  return (
    <div className="min-h-screen bg-nude-50 flex flex-col">

      {/* AR overlay */}
      {mode === "ar" && (
        <div className="fixed inset-0 z-50 bg-black">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="absolute top-0 left-0 right-0 px-5 pt-12 pb-4 flex items-center justify-between">
            <button onClick={stopAR} className="w-10 h-10 rounded-2xl bg-black/50 flex items-center justify-center text-white text-lg">✕</button>
            <div className="bg-black/50 rounded-2xl px-4 py-2"><p className="text-white text-sm font-bold">AR Qibla</p></div>
            <div className="w-10" />
          </div>
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <div className="bg-black/60 rounded-3xl px-6 py-3 flex items-center gap-3">
              {aligned && <span className="text-green-400 text-lg animate-pulse">●</span>}
              <p className="text-white text-sm font-bold">
                {aligned ? "Facing Qibla 🕋" : `Turn ${Math.round(Math.abs(degsToQibla))}° ${degsToQibla > 0 ? "right" : "left"}`}
              </p>
              {dist && <p className="text-white/50 text-xs">{dist} away</p>}
            </div>
          </div>
        </div>
      )}

      {/* Compass mode */}
      {mode === "compass" && (
        <>
          {/* Header */}
          <div className="px-5 pt-12 pb-5 relative overflow-hidden"
            style={{ background: "linear-gradient(160deg,#c8705a,#d4786a 60%,#e8a090)" }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <button onClick={() => router.back()}
                className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold">←</button>
              <div>
                <p className="font-body text-xs text-white/70 tracking-widest uppercase">Direction</p>
                <h1 className="font-display text-2xl font-bold text-white">Qibla Finder</h1>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap relative z-10">
              {dist && (
                <div className="bg-white/20 rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-xs">🕋</span>
                  <p className="text-white text-xs font-bold">{dist} to Mecca</p>
                </div>
              )}
              {location && (
                <div className="bg-white/20 rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-xs">📍</span>
                  <p className="text-white text-xs font-bold">{location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center px-5 py-5 gap-4">

            {status === "loading" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-nude-200 border-t-nude-500 animate-spin" />
                <p className="font-body text-nude-500 text-sm">Getting your location...</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="bg-white border border-nude-200 rounded-3xl p-6 text-center w-full shadow-sm">
                  <p className="text-3xl mb-2">📍</p>
                  <p className="font-display text-base font-bold text-nude-700 mb-1">Location Required</p>
                  <p className="font-body text-xs text-nude-400 mb-4">{errorMsg}</p>
                  <button onClick={requestLocation}
                    className="px-6 py-3 bg-gradient-to-r from-nude-400 to-nude-500 text-white text-sm font-bold rounded-2xl">
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {(status === "ready") && (
              <>
                {/* ═══════════════════════════════════════════════
                    COMPASS — pure SVG, no CSS arrow tricks
                    - Entire SVG rotates by -heading
                    - Qibla arrow group rotates by qiblaAngle inside SVG
                    Net screen rotation of arrow = qiblaAngle - heading
                    When facing Qibla: heading=qiblaAngle → arrow at top
                ═══════════════════════════════════════════════ */}
                <div className="relative flex items-center justify-center w-full">
                  {/* Alignment glow */}
                  {aligned && (
                    <div className="absolute w-72 h-72 rounded-full border-4 border-green-400 animate-ping opacity-25 pointer-events-none" />
                  )}

                  <svg
                    width="320" height="320"
                    viewBox="0 0 320 320"
                    style={{
                      transform: `rotate(${dialRotDeg}deg)`,
                      transition: "transform 0.1s ease-out",
                      willChange: "transform",
                      overflow: "visible",
                    }}
                  >
                    {/* ── Outer ring background ────────────────── */}
                    <circle cx={CX} cy={CY} r={R_OUTER}
                      fill={aligned ? "#d4f0d8" : "#f0e0d8"}
                      stroke={aligned ? "#86efac" : "#e8c4b8"}
                      strokeWidth="2" />

                    {/* ── Tick marks ───────────────────────────── */}
                    {Array.from({ length: 72 }).map((_, i) => {
                      const angle  = i * 5;
                      const rad    = toRad(angle - 90);
                      const isMaj  = angle % 90 === 0;
                      const isMed  = angle % 45 === 0 && !isMaj;
                      const r1     = isMaj ? R_OUTER - 2  : isMed ? R_OUTER - 2  : R_OUTER - 2;
                      const r2     = isMaj ? R_OUTER - 14 : isMed ? R_OUTER - 10 : R_OUTER - 7;
                      const sw     = isMaj ? 2.5 : isMed ? 1.5 : 0.8;
                      const col    = isMaj ? "#b07060" : "#d4a090";
                      return (
                        <line key={i}
                          x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
                          x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
                          stroke={col} strokeWidth={sw} strokeLinecap="round" />
                      );
                    })}

                    {/* ── Cardinal labels ──────────────────────── */}
                    {[
                      { label: "N", angle: 0,   color: "#c8503a", size: 18, weight: "bold" },
                      { label: "E", angle: 90,  color: "#a07060", size: 14, weight: "normal" },
                      { label: "S", angle: 180, color: "#a07060", size: 14, weight: "normal" },
                      { label: "W", angle: 270, color: "#a07060", size: 14, weight: "normal" },
                    ].map(({ label, angle, color, size, weight }) => {
                      const rad = toRad(angle - 90);
                      const r   = R_OUTER - 22;
                      return (
                        <text key={label}
                          x={CX + r * Math.cos(rad)}
                          y={CY + r * Math.sin(rad)}
                          textAnchor="middle" dominantBaseline="central"
                          fontSize={size} fontWeight={weight}
                          fontFamily="serif"
                          fill={color}>
                          {label}
                        </text>
                      );
                    })}

                    {/* ── NE / NW / SE / SW ────────────────────── */}
                    {[
                      { label: "NE", angle: 45  },
                      { label: "SE", angle: 135 },
                      { label: "SW", angle: 225 },
                      { label: "NW", angle: 315 },
                    ].map(({ label, angle }) => {
                      const rad = toRad(angle - 90);
                      const r   = R_OUTER - 22;
                      return (
                        <text key={label}
                          x={CX + r * Math.cos(rad)}
                          y={CY + r * Math.sin(rad)}
                          textAnchor="middle" dominantBaseline="central"
                          fontSize={9} fill="#c8a098">
                          {label}
                        </text>
                      );
                    })}

                    {/* ── Inner face ───────────────────────────── */}
                    <circle cx={CX} cy={CY} r={R_INNER}
                      fill="white" fillOpacity="0.95"
                      stroke="#e8d0c8" strokeWidth="1" />

                    {/* ── Qibla arrow group ────────────────────────
                        rotate(qiblaAngle) inside the SVG.
                        SVG is already rotated by -heading externally.
                        Net angle on screen = qiblaAngle - heading.
                    ─────────────────────────────────────────────── */}
                    <g transform={`rotate(${qiblaDeg}, ${CX}, ${CY})`}>
                      {/* Arrow shaft */}
                      <line
                        x1={CX} y1={CY + 30}
                        x2={CX} y2={CY - R_INNER + 18}
                        stroke={aligned ? "#4ade80" : "#d4786a"}
                        strokeWidth="4" strokeLinecap="round" />
                      {/* Arrow head pointing UP (toward N = top of SVG) */}
                      <polygon
                        points={`${CX},${CY - R_INNER + 4} ${CX - 10},${CY - R_INNER + 22} ${CX + 10},${CY - R_INNER + 22}`}
                        fill={aligned ? "#4ade80" : "#d4786a"} />
                      {/* Tail */}
                      <circle cx={CX} cy={CY + 34} r="5"
                        fill={aligned ? "#86efac" : "#e8a090"} />
                      {/* Kaaba label on arrow */}
                      <text x={CX} y={CY - R_INNER + 40}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize="16">🕋</text>
                    </g>

                    {/* ── Center pivot ─────────────────────────── */}
                    <circle cx={CX} cy={CY} r="8"
                      fill={aligned ? "#4ade80" : "#d4786a"} />
                    <circle cx={CX} cy={CY} r="4" fill="white" />
                  </svg>

                  {/* Heading readout — on top of SVG, not rotating */}
                  <div className="absolute pointer-events-none flex flex-col items-center justify-center"
                    style={{ width: "90px", height: "90px" }}>
                    <p className="font-display text-2xl font-black leading-none"
                      style={{ color: aligned ? "#16a34a" : "#d4786a" }}>
                      {Math.round(heading)}°
                    </p>
                    <p className="font-body text-xs text-nude-400 mt-0.5">{headingLabel}</p>
                  </div>
                </div>

                {/* Instruction */}
                <div className="w-full bg-nude-100 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <span>📱</span>
                  <p className="font-body text-xs text-nude-600">
                    Rotate your phone until the <strong>🕋 arrow points up</strong>
                  </p>
                </div>

                {/* Status */}
                <div className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-3 transition-all
                  ${aligned ? "bg-green-50 border border-green-200" : "bg-white border border-nude-200 shadow-sm"}`}>
                  {aligned ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="font-display text-base font-bold text-green-700">Facing Qibla!</p>
                        <p className="font-body text-xs text-green-600">Aligned with the Kaaba 🕋</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🧭</span>
                      <div>
                        {hasCompass ? (
                          <>
                            <p className="font-display text-sm font-bold text-nude-700">
                              Turn {Math.round(Math.abs(degsToQibla))}°{" "}
                              {degsToQibla > 0 ? "clockwise →" : "← counter-clockwise"}
                            </p>
                            <p className="font-body text-xs text-nude-400">
                              Qibla is {qiblaAngle ? Math.round(qiblaAngle) : "—"}° from North
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-display text-sm font-bold text-nude-700">
                              Compass not active
                            </p>
                            <p className="font-body text-xs text-nude-400">
                              Enable compass below to get live direction
                            </p>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* iOS permission — only shows on iOS 13+ */}
                {needsPermission && (
                  <button
                    onClick={requestCompassPermission}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold font-body flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    style={{ background: "linear-gradient(to right,#d4786a,#c8705a)", color: "white" }}>
                    🧭 Allow Compass Access
                  </button>
                )}

                {/* Android calibration warning */}
                {compassSource === "android-rel" && (
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                    <p className="font-body text-xs font-bold text-amber-700">⚠️ Calibrate for better accuracy</p>
                    <p className="font-body text-xs text-amber-600 mt-0.5">Wave phone in a figure-8 shape</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="w-full grid grid-cols-2 gap-3">
                  <button onClick={startAR}
                    className="py-3 rounded-2xl bg-gradient-to-r from-nude-400 to-nude-500 text-white text-sm font-bold font-body flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
                    📷 AR Mode
                  </button>
                  <button onClick={() => { setCalibrating(true); setTimeout(() => setCalibrating(false), 1500); }}
                    className={`py-3 rounded-2xl text-sm font-bold font-body border flex items-center justify-center gap-2 active:scale-95 transition-all
                      ${calibrating ? "bg-nude-200 text-nude-600 border-nude-300" : "bg-white text-nude-600 border-nude-200"}`}>
                    {calibrating ? "✓ Done!" : "🔄 Calibrate"}
                  </button>
                </div>

                <p className="text-center text-xs text-nude-300 font-body pb-2">
                  Works offline · Location cached automatically
                </p>
              </>
            )}

            {status === "idle" && (
              <div className="flex-1 flex items-center justify-center">
                <button onClick={requestLocation}
                  className="px-8 py-4 bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold font-body rounded-2xl shadow-md active:scale-95 transition-transform">
                  📍 Find Qibla Direction
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}