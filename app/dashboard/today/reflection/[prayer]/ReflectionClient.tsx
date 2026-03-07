"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReflection } from "@/lib/actions/reflection";

const PRAYER_ICONS: Record<string, string> = {
  Fajr: "🌙", Dhuhr: "☀️", Asr: "🌤️", Maghrib: "🌇", Isha: "🌌",
};

const DHIKR_LIST = [
  { id: "subhanallah",    arabic: "سُبْحَانَ اللَّهِ",    label: "Subhanallah",    meaning: "Glory be to Allah",       count: 33 },
  { id: "alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ",    label: "Alhamdulillah",  meaning: "All praise be to Allah",   count: 33 },
  { id: "allahuakbar",   arabic: "اللَّهُ أَكْبَرُ",      label: "Allahu Akbar",   meaning: "Allah is the Greatest",    count: 33 },
  { id: "astaghfirullah",arabic: "أَسْتَغْفِرُ اللَّهَ", label: "Astaghfirullah", meaning: "I seek forgiveness",       count: 33 },
];

const QUICK_DUAS = [
  { id: "ayatul_kursi",   label: "Ayatul Kursi",          arabic: "آية الكرسي" },
  { id: "surah_ikhlas",   label: "Surah Al-Ikhlas (x3)",  arabic: "سورة الإخلاص" },
  { id: "surah_falaq",    label: "Surah Al-Falaq",         arabic: "سورة الفلق" },
  { id: "surah_nas",      label: "Surah An-Nas",           arabic: "سورة الناس" },
  { id: "dua_forgiveness",label: "Dua for Forgiveness",   arabic: "دعاء المغفرة" },
  { id: "dua_parents",    label: "Dua for Parents",        arabic: "دعاء للوالدين" },
  { id: "dua_health",     label: "Dua for Health",         arabic: "دعاء الصحة" },
  { id: "dua_guidance",   label: "Dua for Guidance",       arabic: "دعاء الهداية" },
  { id: "dua_gratitude",  label: "Dua of Gratitude",       arabic: "دعاء الشكر" },
  { id: "salawat",        label: "Salawat on the Prophet ﷺ", arabic: "الصلاة على النبي" },
];

interface Props {
  prayerName: string;
  prayerLog: {
    id: string;
    status: string;
    note: string | null;
    dhikr: string | null;
    duas: string | null;
  } | null;
}

export default function ReflectionClient({ prayerName, prayerLog }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Parse saved data
  const parsedDhikr: string[] = prayerLog?.dhikr ? JSON.parse(prayerLog.dhikr) : [];
  const parsedDuas:  string[] = prayerLog?.duas   ? JSON.parse(prayerLog.duas)  : [];

  const [selectedDhikr, setSelectedDhikr] = useState<string[]>(parsedDhikr);
  const [selectedDuas,  setSelectedDuas]  = useState<string[]>(parsedDuas);
  const [note, setNote]                   = useState(prayerLog?.note ?? "");
  const [customDua, setCustomDua]         = useState("");
  const [customDuas, setCustomDuas]       = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleDhikr = (id: string) => {
    setSelectedDhikr(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleDua = (id: string) => {
    setSelectedDuas(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const addCustomDua = () => {
    if (!customDua.trim()) return;
    const id = `custom_${Date.now()}`;
    setCustomDuas(prev => [...prev, customDua.trim()]);
    setSelectedDuas(prev => [...prev, id]);
    setCustomDua("");
    setShowCustomInput(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveReflection({
        prayerName,
        dhikr: selectedDhikr,
        duas: [...selectedDuas, ...customDuas],
        note,
      });
      if (!result.error) {
        setSaved(true);
        router.refresh(); // re-fetch server data so note shows on PrayerCard
        setTimeout(() => router.back(), 800);
      }
    });
  };

  const completedCount = selectedDhikr.length + selectedDuas.length + (note.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-nude-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12 pb-6 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center text-nude-600 font-bold"
          >
            ←
          </button>
          <div>
            <p className="font-body text-xs tracking-widest text-nude-500 uppercase">Reflection</p>
            <h1 className="font-display text-2xl font-bold text-nude-800 flex items-center gap-2">
              {PRAYER_ICONS[prayerName]} {prayerName}
            </h1>
          </div>
        </div>
        {completedCount > 0 && (
          <div className="mt-3 bg-white/60 rounded-2xl px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: Math.min(completedCount, 8) }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-nude-500" />
              ))}
            </div>
            <p className="font-body text-xs text-nude-600">{completedCount} reflection{completedCount > 1 ? "s" : ""} added</p>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* ── Section 1: Dhikr ─────────────────────────── */}
        <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-nude-100 bg-nude-50 flex items-center gap-2">
            <span className="text-lg">📿</span>
            <div>
              <p className="font-display text-base font-bold text-nude-800">Dhikr</p>
              <p className="font-body text-xs text-nude-400">Tap to mark as recited</p>
            </div>
          </div>
          <div className="divide-y divide-nude-50">
            {DHIKR_LIST.map(dhikr => {
              const selected = selectedDhikr.includes(dhikr.id);
              return (
                <button
                  key={dhikr.id}
                  onClick={() => toggleDhikr(dhikr.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors
                    ${selected ? "bg-nude-50" : "hover:bg-nude-50/50"}`}
                >
                  {/* Checkbox */}
                  <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${selected
                      ? "bg-gradient-to-br from-nude-400 to-nude-500 border-nude-500"
                      : "border-nude-200 bg-white"}`}>
                    {selected && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                  {/* Text */}
                  <div className="flex-1">
                    <p className={`font-body text-sm font-bold transition-colors
                      ${selected ? "text-nude-700" : "text-nude-600"}`}>
                      {dhikr.label}
                    </p>
                    <p className="font-body text-xs text-nude-400">{dhikr.meaning} · ×{dhikr.count}</p>
                  </div>
                  {/* Arabic */}
                  <p className="text-right text-base text-nude-500 font-arabic"
                     style={{ fontFamily: "serif", direction: "rtl" }}>
                    {dhikr.arabic}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: Duas ──────────────────────────── */}
        <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-nude-100 bg-nude-50 flex items-center gap-2">
            <span className="text-lg">🤲</span>
            <div>
              <p className="font-display text-base font-bold text-nude-800">Duas</p>
              <p className="font-body text-xs text-nude-400">Mark which duas you read</p>
            </div>
          </div>

          {/* Grid of duas */}
          <div className="p-3 grid grid-cols-2 gap-2">
            {QUICK_DUAS.map(dua => {
              const selected = selectedDuas.includes(dua.id);
              return (
                <button
                  key={dua.id}
                  onClick={() => toggleDua(dua.id)}
                  className={`rounded-2xl p-3 text-left transition-all border
                    ${selected
                      ? "bg-nude-100 border-nude-300"
                      : "bg-nude-50 border-nude-100 hover:border-nude-200"}`}
                >
                  <p className={`font-body text-xs font-bold leading-tight
                    ${selected ? "text-nude-700" : "text-nude-500"}`}>
                    {selected && "✓ "}{dua.label}
                  </p>
                  <p className="text-xs text-nude-400 mt-0.5"
                     style={{ fontFamily: "serif", direction: "rtl" }}>
                    {dua.arabic}
                  </p>
                </button>
              );
            })}

            {/* Custom duas */}
            {customDuas.map((dua, i) => (
              <button
                key={`custom_${i}`}
                className="rounded-2xl p-3 text-left bg-nude-100 border border-nude-300"
              >
                <p className="font-body text-xs font-bold text-nude-700">✓ {dua}</p>
                <p className="font-body text-xs text-nude-400">Custom dua</p>
              </button>
            ))}

            {/* Add custom button */}
            <button
              onClick={() => setShowCustomInput(true)}
              className="rounded-2xl p-3 text-left bg-white border border-dashed border-nude-300 hover:border-nude-400 transition-colors"
            >
              <p className="font-body text-xs font-bold text-nude-400">+ Add custom dua</p>
            </button>
          </div>

          {/* Custom dua input */}
          {showCustomInput && (
            <div className="px-4 pb-4 flex gap-2">
              <input
                value={customDua}
                onChange={e => setCustomDua(e.target.value)}
                placeholder="Enter dua name..."
                className="flex-1 bg-nude-50 border border-nude-200 rounded-2xl px-3 py-2 text-sm font-body text-nude-800 focus:outline-none focus:border-nude-400"
                autoFocus
                onKeyDown={e => e.key === "Enter" && addCustomDua()}
              />
              <button
                onClick={addCustomDua}
                className="px-4 py-2 bg-nude-400 text-white text-sm font-bold font-body rounded-2xl"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* ── Section 3: Notes ─────────────────────────── */}
        <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-nude-100 bg-nude-50 flex items-center gap-2">
            <span className="text-lg">✍️</span>
            <div>
              <p className="font-display text-base font-bold text-nude-800">Personal Reflection</p>
              <p className="font-body text-xs text-nude-400">Gratitude, reminders, thoughts...</p>
            </div>
          </div>
          <div className="p-4">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What are you grateful for today? Any reminders for yourself? How was this prayer?..."
              rows={5}
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-3 text-sm font-body text-nude-800 placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isPending || saved}
          className={`w-full py-4 rounded-2xl font-bold font-body text-sm transition-all active:scale-95
            ${saved
              ? "bg-green-100 text-green-600"
              : "bg-gradient-to-r from-nude-400 to-nude-500 text-white shadow-md"
            } disabled:opacity-70`}
        >
          {saved ? "Saved! 🌸 Going back..." : isPending ? "Saving..." : "Save Reflection 🌸"}
        </button>

        <p className="text-center text-xs text-nude-300 font-body">
          May your prayers be accepted 🤲
        </p>
      </div>
    </div>
  );
}