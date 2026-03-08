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
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const prevCompass = useRef(0);

  const [qibla,  setQibla]  = useState<number | null>(null);
  const [dist,   setDist]   = useState<number | null>(null);
  const [loc,    setLoc]    = useState<{ lat: number; lng: number } | null>(null);
  const [compass, setCompass] = useState(0);   // smoothed device heading
  const [sensorOn, setSensorOn] = useState(false);
  const [showBtn,  setShowBtn]  = useState(false); // iOS needs tap
  const [gpsErr,   setGpsErr]   = useState("");
  const [gpsReady, setGpsReady] = useState(false);
  const [arMode,   setArMode]   = useState(false);
  const [arStream, setArStream] = useState<MediaStream | null>(null);
  const [calibMsg, setCalibMsg] = useState(false);

  // ── GPS ────────────────────────────────────────────────────
  useEffect(() => {
    const cached = localStorage.getItem("qibla_loc");
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached);
        applyLocation(lat, lng);
        setGpsReady(true);
      } catch {}
    }
    if (!navigator.geolocation) {
      setGpsErr("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        applyLocation(lat, lng);
        localStorage.setItem("qibla_loc", JSON.stringify({ lat, lng }));
        setGpsReady(true);
        startSensor();
      },
      () => {
        if (gpsReady) { startSensor(); }
        else setGpsErr("Enable location to find Qibla direction.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  function applyLocation(lat: number, lng: number) {
    setLoc({ lat, lng });
    setQibla(getQibla(lat, lng));
    setDist(getDist(lat, lng));
  }

  // ── Sensor ─────────────────────────────────────────────────
  // Pattern from: https://dev.to/orkhanjafarovr/real-compass-on-mobile-browsers-with-javascript-3emi
  function startSensor() {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIOS) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        // iOS 13+ — must be triggered by user gesture, show button
        setShowBtn(true);
      } else {
        // Older iOS — just attach
        attachOrientation();
      }
    } else {
      // Android Chrome: deviceorientationabsolute gives true North directly
      attachOrientation();
    }
  }

  function attachOrientation() {
    const win = window as any;

    // Single handler for both iOS and Android
    // compass = webkitCompassHeading (iOS) || Math.abs(alpha - 360) (Android)
    // This is the exact formula confirmed to work on both platforms
    const handler = (e: DeviceOrientationEvent) => {
      const raw: number =
        (e as any).webkitCompassHeading != null
          ? (e as any).webkitCompassHeading          // iOS: true-North bearing, 0–360 CW
          : Math.abs((e.alpha ?? 0) - 360);          // Android: convert to compass bearing

      // Smooth with exponential low-pass filter
      const prev = prevCompass.current;
      let diff = raw - prev;
      if (diff >  180) diff -= 360;
      if (diff < -180) diff += 360;
      const smoothed = (prev + diff * 0.25 + 360) % 360;
      prevCompass.current = smoothed;
      setCompass(smoothed);
      setSensorOn(true);
    };

    // Try absolute orientation first (Android Chrome — guaranteed true North)
    if ("ondeviceorientationabsolute" in window) {
      win.addEventListener("deviceorientationabsolute", handler, true);
    } else {
      // iOS uses plain deviceorientation + webkitCompassHeading
      win.addEventListener("deviceorientation", handler, true);
    }
  }

  // Called when iOS user taps the permission button
  async function handleIOSPermission() {
    try {
      const res = await (DeviceOrientationEvent as any).requestPermission();
      if (res === "granted") {
        setShowBtn(false);
        attachOrientation();
      }
    } catch {
      setShowBtn(false);
    }
  }

  // ── Alignment ──────────────────────────────────────────────
  // Arrow screen angle = qiblaAngle - compass
  // Aligned when this ≈ 0° (arrow pointing up)
  const arrowScreenAngle = qibla !== null ? ((qibla - compass) + 360) % 360 : 0;
  const aligned = arrowScreenAngle < 8 || arrowScreenAngle > 352;

  // Signed degrees to turn (-= CCW, += CW)
  const turnDeg = arrowScreenAngle > 180 ? arrowScreenAngle - 360 : arrowScreenAngle;

  // ── AR ─────────────────────────────────────────────────────
  async function startAR() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setArStream(s);
      setArMode(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      }, 80);
    } catch {}
  }
  function stopAR() {
    arStream?.getTracks().forEach(t => t.stop());
    setArStream(null);
    cancelAnimationFrame(rafRef.current);
    setArMode(false);
  }
  useEffect(() => {
    if (!arMode || !canvasRef.current) return;
    const cv = canvasRef.current, ctx = cv.getContext("2d")!;
    const draw = () => {
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const cx = cv.width/2, cy = cv.height/2;
      const len = Math.min(cv.width, cv.height) * 0.35;
      const r = toRad(arrowScreenAngle - 90);
      const tx = cx + Math.cos(r)*len, ty = cy + Math.sin(r)*len;
      ctx.save();
      ctx.shadowColor = aligned ? "#4ade80" : "#d4786a"; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(tx,ty);
      ctx.strokeStyle = aligned ? "#4ade80" : "#d4786a"; ctx.lineWidth=5; ctx.lineCap="round"; ctx.stroke();
      const li={x:tx+Math.cos(r+2.5)*22,y:ty+Math.sin(r+2.5)*22}, ri={x:tx+Math.cos(r-2.5)*22,y:ty+Math.sin(r-2.5)*22};
      ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(li.x,li.y); ctx.lineTo(ri.x,ri.y);
      ctx.closePath(); ctx.fillStyle=aligned?"#4ade80":"#d4786a"; ctx.fill(); ctx.restore();
      ctx.font="bold 15px sans-serif"; ctx.fillStyle="white"; ctx.textAlign="center";
      ctx.fillText(aligned?"🕋 Facing Qibla!": `Turn ${Math.round(Math.abs(turnDeg))}°`, cx, cy-len-14);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [arMode, arrowScreenAngle, aligned]);

  // ── Display ────────────────────────────────────────────────
  const distLabel = dist
    ? dist > 1000 ? `${(dist/1000).toFixed(1)}k km` : `${Math.round(dist)} km`
    : null;
  const CARDS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  const headingCard = CARDS[Math.round(compass / 22.5) % 16];

  // Rotation values — the two independent transforms
  const dialRotate  = -compass;          // whole compass dial
  const arrowRotate = arrowScreenAngle;  // qibla arrow only

  return (
    <div className="min-h-screen bg-nude-50 flex flex-col pb-24">

      {/* AR overlay */}
      {arMode && (
        <div className="fixed inset-0 z-50 bg-black">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="absolute top-12 left-5 right-5 flex justify-between items-center">
            <button onClick={stopAR} className="w-10 h-10 rounded-2xl bg-black/50 text-white flex items-center justify-center font-bold text-lg">✕</button>
            <div className="bg-black/50 rounded-2xl px-4 py-2"><p className="text-white text-sm font-bold">AR Mode</p></div>
            <div className="w-10"/>
          </div>
          <div className="absolute bottom-10 left-0 right-0 flex justify-center px-5">
            <div className="bg-black/60 rounded-3xl px-6 py-3 flex items-center gap-3">
              {aligned && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>}
              <p className="text-white text-sm font-bold">
                {aligned ? "Facing Qibla 🕋" : `Turn ${Math.round(Math.abs(turnDeg))}° ${turnDeg > 0 ? "right →" : "← left"}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-12 pb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#c8705a,#d4786a 55%,#e8a090)" }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10"/>
        <div className="flex items-center gap-3 mb-4 relative z-10">
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
          {qibla !== null && (
            <div className="bg-white/20 rounded-2xl px-3 py-1.5">
              <p className="text-white text-xs font-bold">Qibla: {Math.round(qibla)}° from N</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center px-5 py-5 gap-4">

        {/* GPS error */}
        {gpsErr && !gpsReady && (
          <div className="w-full bg-white border border-nude-200 rounded-3xl p-5 text-center shadow-sm">
            <p className="text-3xl mb-2">📍</p>
            <p className="font-display text-base font-bold text-nude-700 mb-1">Location Required</p>
            <p className="font-body text-xs text-nude-400 mb-4">{gpsErr}</p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-nude-400 to-nude-500 text-white text-sm font-bold rounded-2xl">
              Try Again
            </button>
          </div>
        )}

        {!gpsReady && !gpsErr && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-14 h-14 rounded-full border-4 border-nude-200 border-t-nude-500 animate-spin"/>
            <p className="font-body text-nude-500 text-sm">Getting your location...</p>
          </div>
        )}

        {gpsReady && (
          <>
            {/* ═══════════════════════════════════════════════════
                THE COMPASS

                Layer 1 — compass DIAL  → rotate(-compass)
                  The entire ring (ticks + N/S/E/W) rotates.
                  When you face North:  N is at top.
                  When you face East:   E is at top, N swings left.

                Layer 2 — QIBLA ARROW  → rotate(qiblaAngle - compass)
                  Fixed to the Earth, not to the screen.
                  When you face Qibla:  arrow is at top.

                This is the exact pattern from working Qibla apps:
                compass = webkitCompassHeading || Math.abs(alpha - 360)
                dial.style.transform = `rotate(${-compass}deg)`
                arrow.style.transform = `rotate(${qibla - compass}deg)`
            ═══════════════════════════════════════════════════ */}
            <div className="relative w-72 h-72 flex items-center justify-center">

              {aligned && (
                <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-20 pointer-events-none z-0"/>
              )}

              {/* ─ DIAL ─ rotates by -compass ─ */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `rotate(${dialRotate}deg)`,
                  transition: "transform 0.08s linear",
                  willChange: "transform",
                }}
              >
                <svg width="288" height="288" viewBox="0 0 288 288">
                  {/* Bezel ring */}
                  <circle cx="144" cy="144" r="142" fill="#f0ddd5" stroke="#ddc0b0" strokeWidth="1.5"/>
                  {/* Inner white face boundary */}
                  <circle cx="144" cy="144" r="106" fill="white" stroke="#e8d0c8" strokeWidth="1"/>

                  {/* Degree ticks — 72 ticks at every 5° */}
                  {Array.from({length:72}).map((_,i) => {
                    const a = i*5, r1=140, isMaj=a%90===0, isMed=a%45===0&&!isMaj;
                    const r2 = isMaj?122:isMed?128:133;
                    const rad = toRad(a-90);
                    return (
                      <line key={i}
                        x1={144+r1*Math.cos(rad)} y1={144+r1*Math.sin(rad)}
                        x2={144+r2*Math.cos(rad)} y2={144+r2*Math.sin(rad)}
                        stroke={isMaj?"#a06050":isMed?"#c08070":"#d8b0a0"}
                        strokeWidth={isMaj?2.5:isMed?1.5:0.8} strokeLinecap="round"/>
                    );
                  })}

                  {/* N — bold red, with North triangle */}
                  <polygon points="144,4 137,22 151,22" fill="#c8402a"/>
                  <text x="144" y="36" textAnchor="middle" dominantBaseline="central"
                    fontSize="18" fontWeight="bold" fontFamily="Georgia,serif" fill="#c8402a">N</text>

                  {/* S E W */}
                  <text x="144" y="256" textAnchor="middle" dominantBaseline="central"
                    fontSize="15" fontFamily="Georgia,serif" fill="#907060">S</text>
                  <text x="256" y="144" textAnchor="middle" dominantBaseline="central"
                    fontSize="15" fontFamily="Georgia,serif" fill="#907060">E</text>
                  <text x="32" y="144" textAnchor="middle" dominantBaseline="central"
                    fontSize="15" fontFamily="Georgia,serif" fill="#907060">W</text>

                  {/* Intercardinals */}
                  {[{t:"NE",x:233,y:55},{t:"SE",x:233,y:233},{t:"SW",x:55,y:233},{t:"NW",x:55,y:55}].map(({t,x,y})=>(
                    <text key={t} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                      fontSize="9" fontFamily="Georgia,serif" fill="#c0907880">{t}</text>
                  ))}
                </svg>
              </div>

              {/* ─ QIBLA ARROW ─ rotates by (qibla - compass) ─ */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `rotate(${arrowRotate}deg)`,
                  transition: "transform 0.08s linear",
                  willChange: "transform",
                }}
              >
                <svg width="288" height="288" viewBox="0 0 288 288">
                  {/* Shaft from center (144,144) upward to near the ring */}
                  <line x1="144" y1="150" x2="144" y2="60"
                    stroke={aligned?"#22c55e":"#d4786a"} strokeWidth="4" strokeLinecap="round"/>
                  {/* Arrowhead pointing UP */}
                  <polygon points="144,42 133,64 155,64"
                    fill={aligned?"#22c55e":"#d4786a"}/>
                  {/* Kaaba icon near tip */}
                  <text x="144" y="88" textAnchor="middle" dominantBaseline="central" fontSize="20">🕋</text>
                  {/* Tail */}
                  <line x1="144" y1="150" x2="144" y2="185"
                    stroke={aligned?"#86efac":"#e8b0a0"} strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="144" cy="190" r="5" fill={aligned?"#86efac":"#e8b0a0"}/>
                </svg>
              </div>

              {/* ─ CENTER FACE — never rotates ─ */}
              <div className="relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center pointer-events-none"
                style={{ background: "radial-gradient(circle at 38% 35%,#fff 0%,#f8ede8 100%)" }}>
                <p className="font-display text-3xl font-black leading-none"
                  style={{ color: aligned ? "#16a34a" : "#c8705a" }}>
                  {Math.round(compass)}°
                </p>
                <p className="font-body text-sm font-semibold mt-0.5" style={{ color: "#a07060" }}>
                  {headingCard}
                </p>
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${aligned?"bg-green-400":"bg-nude-300"}`}/>
              </div>
            </div>

            {/* iOS permission button */}
            {showBtn && (
              <button
                onClick={handleIOSPermission}
                className="w-full py-4 rounded-2xl font-bold text-sm font-body text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(to right,#c8705a,#d4786a)" }}>
                🧭 Allow Compass Access
              </button>
            )}

            {/* Instruction */}
            <div className="w-full bg-nude-100 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <span>📱</span>
              <p className="font-body text-xs text-nude-600">
                {sensorOn
                  ? <>Rotate until <strong>🕋 arrow points straight up</strong> — that's Qibla</>
                  : showBtn
                    ? "Tap Allow above, then hold phone flat and rotate"
                    : "Hold phone flat — compass activating..."}
              </p>
            </div>

            {/* Status */}
            <div className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-3 transition-all duration-200
              ${aligned ? "bg-green-50 border border-green-200" : "bg-white border border-nude-200 shadow-sm"}`}>
              {aligned ? (
                <>
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-display text-base font-bold text-green-700">Facing Qibla!</p>
                    <p className="font-body text-xs text-green-600">Aligned with the Kaaba 🕋</p>
                  </div>
                </>
              ) : sensorOn ? (
                <>
                  <span className="text-xl">🧭</span>
                  <div>
                    <p className="font-display text-sm font-bold text-nude-700">
                      Turn {Math.round(Math.abs(turnDeg))}°{" "}
                      <span className="font-body font-normal text-nude-500">
                        {turnDeg > 0 ? "clockwise →" : "← counter-clockwise"}
                      </span>
                    </p>
                    <p className="font-body text-xs text-nude-400">Qibla is {Math.round(qibla ?? 0)}° from North</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xl">🧭</span>
                  <div>
                    <p className="font-display text-sm font-bold text-nude-700">Compass starting up…</p>
                    <p className="font-body text-xs text-nude-400">
                      {showBtn ? "Tap the button above first" : "Move phone slightly to activate sensor"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Calibrate */}
            {sensorOn && (
              <button
                onClick={() => { setCalibMsg(true); setTimeout(() => setCalibMsg(false), 3500); }}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold font-body border transition-all
                  ${calibMsg ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-nude-400 border-nude-200"}`}>
                {calibMsg ? "✦ Move phone in slow figure-8 pattern now" : "🔄 Inaccurate? Tap to calibrate"}
              </button>
            )}

            {/* AR Mode */}
            <button onClick={startAR}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-nude-400 to-nude-500 text-white text-sm font-bold font-body flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm">
              📷 Try AR Mode
            </button>

            <p className="text-center text-xs text-nude-300 font-body">
              Works offline · Location cached automatically
            </p>
          </>
        )}
      </div>
    </div>
  );
}