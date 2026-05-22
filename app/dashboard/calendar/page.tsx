import { createClient }      from "@/lib/supabase/server";
import { getMonthPrayerData } from "@/lib/actions/calendar";
import {
  getTodayHijri,
  getHijriMonthDays,
}                             from "@/lib/hijriCalendar";
import HijriCalendar          from "@/components/calendar/HijriCalendar";
import MenuButton             from "@/components/ui/MenuButton";

export const dynamic   = "force-dynamic";
export const revalidate = 0;

export default async function CalendarPage() {
  // ── Supabase auth (page is protected by DashboardLayout middleware) ──────
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Today's Hijri date (server-side, consistent with TodayHeader) ─────────
  const todayHijri = getTodayHijri();

  // ── Pre-fetch prayer data for the initial month ───────────────────────────
  const initialDays  = getHijriMonthDays(todayHijri.year, todayHijri.month);
  const fromDate     = initialDays[0]?.gregorianStr  ?? "";
  const toDate       = initialDays[initialDays.length - 1]?.gregorianStr ?? "";

  const { detailMap, completionMap } = user && fromDate
    ? await getMonthPrayerData(fromDate, toDate)
    : { detailMap: {}, completionMap: {} };

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ background: "var(--color-bg-primary)" }}>

      {/* Header */}
      <div
        className="px-5 pt-12 md:pt-6 pb-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #f5e6df 0%, #f0d8ce 60%, #ecddd6 100%)",
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-40"
          style={{ background: "#e8c4b8" }}
        />
        <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={false} />

        <p className="font-body text-[10px] tracking-widest text-nude-400
          uppercase mb-1 relative z-10">
          Islamic Calendar
        </p>
        <h1 className="font-display text-3xl font-bold text-nude-700 mb-1
          relative z-10">
          Hijri Calendar 🌙
        </h1>
        <p className="font-body text-sm text-nude-500 relative z-10">
          Prayer heatmap · Islamic events · Monthly view
        </p>
      </div>

      {/* Calendar */}
      <div className="px-4 py-4 space-y-4">
        <HijriCalendar
          initialDetailMap={detailMap}
          initialCompletionMap={completionMap}
          initialHijriDate={todayHijri}
        />

        <p className="text-center text-xs text-nude-300 font-body pb-2">
          Dates based on Umm al-Qura calculation 🌙
        </p>
      </div>
    </div>
  );
}
