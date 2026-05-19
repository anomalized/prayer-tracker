"use client";

import { useState, useEffect } from "react";
import TodayHeader from "@/components/prayers/TodayHeader";
import PrayerCard from "@/components/prayers/PrayerCard";
import StreakBanner from "@/components/ui/StreakBanner";
import Onboarding from "@/components/ui/Onboarding";
import { useStreakCheck } from "@/hooks/useStreakCheck";
import { useScheduleNotifications } from "@/hooks/useScheduleNotifications";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import type { PrayerTime, PrayerLog } from "@/types";

// ── Dua of the Day ─────────────────────────────────────────────
const DUAS = [
  {
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan waqina 'adhab an-nar",
    translation: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
    source: "Surah Al-Baqarah 2:201",
  },
  {
    arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
    transliteration: "Rabbi ishrah li sadri wa yassir li amri",
    translation: "My Lord, expand my chest and ease my task for me.",
    source: "Surah Ta-Ha 20:25-26",
  },
  {
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
    transliteration: "Allahumma inni as'alukal-'afiyata fid-dunya wal-akhirah",
    translation: "O Allah, I ask You for wellbeing in this world and the Hereafter.",
    source: "Ibn Majah",
  },
  {
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidni 'ilma",
    translation: "My Lord, increase me in knowledge.",
    source: "Surah Ta-Ha 20:114",
  },
  {
    arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
    translation: "O Allah, help me remember You, thank You, and worship You in the best manner.",
    source: "Abu Dawud",
  },
  {
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Hasbiyallahu la ilaha illa huwa 'alayhi tawakkaltu wa huwa rabbul 'arshil 'azim",
    translation: "Allah is sufficient for me. There is no god but Him. I have placed my trust in Him, and He is the Lord of the Magnificent Throne.",
    source: "Surah At-Tawbah 9:129",
  },
  {
    arabic: "اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
    transliteration: "Allahummaghfir li wa li walidayya wa lil-mu'minina yawma yaqumul hisab",
    translation: "O Allah, forgive me, my parents, and the believers on the Day of Reckoning.",
    source: "Surah Ibrahim 14:41",
  },
];

function getDuaOfDay(): typeof DUAS[0] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DUAS[dayOfYear % DUAS.length];
}

// ── Props ──────────────────────────────────────────────────────
interface Props {
  userName: string;
  prayerTimes: PrayerTime[];
  prayerTimezone: string;
  prayerDateGregorian: string;
  todayLogs: PrayerLog[];
  stats: {
    total_points: number;
    current_streak: number;
    best_streak: number;
    last_active_date?: string | null;
  } | null;
  notificationsEnabled: boolean;
}

export default function TodayClient({
  userName,
  prayerTimes,
  prayerTimezone,
  prayerDateGregorian,
  todayLogs,
  stats,
  notificationsEnabled,
}: Props) {
  const [extraPoints, setExtraPoints] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [duaExpanded, setDuaExpanded] = useState(false);

  useStreakCheck();

  // ── NEW: offline sync ────────────────────────────────────────────────────
  const { pendingCount, syncToast } = useSyncQueue();
  // ────────────────────────────────────────────────────────────────────────

  useScheduleNotifications({
    prayers: prayerTimes,
    timezone: prayerTimezone,
    dateGregorian: prayerDateGregorian,
    notificationsEnabled,
  });

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_complete");
    if (!seen) setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboarding_complete", "true");
    setShowOnboarding(false);
  };

  const logMap = Object.fromEntries(
    todayLogs.map(l => [l.prayer_name, { status: l.status, note: l.note ?? null }])
  );

  const donePrayers = todayLogs.filter(l => l.status !== "missed").length;
  const dua = getDuaOfDay();

  return (
    <div className="min-h-screen bg-nude-50">
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {/* ── NEW: Sync toast banner ──────────────────────────────────── */}
      {syncToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50
            bg-green-50 border border-green-200 rounded-full px-4 py-2
            shadow-md animate-fade-up"
          role="status"
          aria-live="polite"
        >
          <p className="font-body text-xs font-bold text-green-700 whitespace-nowrap">
            {syncToast}
          </p>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────── */}

      <TodayHeader
        userName={userName}
        donePrayers={donePrayers}
        totalPoints={stats?.total_points ?? 0}
        currentStreak={stats?.current_streak ?? 0}
        extraPoints={extraPoints}
        pendingSync={pendingCount}              // ← NEW
      />

      <StreakBanner
        streak={stats?.current_streak ?? 0}
        lastActiveDate={stats?.last_active_date ?? null}
      />

      {/* 👇 Here is the section that was changed 👇 */}
      <div className="px-4 py-4">

        {/* ── Dua of the Day ──────────────────────────────── */}
        <div className="mb-4">
          <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
            <button
              onClick={() => setDuaExpanded(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-nude-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nude-200 to-nude-300 flex items-center justify-center text-lg flex-shrink-0">
                🤲
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs font-bold tracking-widest text-nude-400 uppercase">Dua of the Day</p>
                <p className="font-body text-sm text-nude-600 truncate">{dua.translation}</p>
              </div>
              <span className={`text-nude-300 text-sm flex-shrink-0 transition-transform duration-200 ${duaExpanded ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            {duaExpanded && (
              <div className="px-4 pb-4 border-t border-nude-100 pt-3 space-y-3">
                {/* Arabic */}
                <p
                  className="text-center text-xl leading-relaxed text-nude-700"
                  style={{ fontFamily: "serif", direction: "rtl", lineHeight: "2.2" }}
                >
                  {dua.arabic}
                </p>
                {/* Transliteration */}
                <p className="text-center font-body text-xs text-nude-500 italic">
                  {dua.transliteration}
                </p>
                {/* Translation */}
                <div className="bg-nude-50 rounded-2xl px-4 py-3">
                  <p className="font-body text-sm text-nude-700 text-center leading-relaxed">
                    "{dua.translation}"
                  </p>
                </div>
                {/* Source */}
                <p className="text-center font-body text-xs text-nude-300">— {dua.source}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Section label ────────────────────────────────── */}
        <div className="flex items-center gap-3 px-1 mb-3">
          <p className="font-body text-xs font-bold tracking-widest text-nude-400 uppercase">
            Today's Prayers
          </p>
          <div className="flex-1 h-px bg-nude-200" />
          <p className="font-body text-xs text-nude-400">{donePrayers}/5 done</p>
        </div>

        {/* ── Prayer cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prayerTimes.map((prayer, i) => (
            <PrayerCard
              key={prayer.name}
              prayer={prayer}
              currentStatus={logMap[prayer.name]?.status ?? null}
              currentNote={logMap[prayer.name]?.note ?? null}
              index={i}
              onPointsEarned={(pts) => setExtraPoints(p => p + pts)}
            />
          ))}
        </div>

        <p className="text-center text-xs text-nude-300 font-body pt-2 pb-6">
          May Allah accept your prayers 🌸
        </p>
      </div>

    </div>
  );
}