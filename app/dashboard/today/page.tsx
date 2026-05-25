import { createClient } from "@/lib/supabase/server";
import { getPrayerTimesWithMeta } from "@/lib/prayerTimes";
import { getTodayLogs, getUserStats } from "@/lib/actions/prayers";
import { getNotificationsEnabled } from "@/lib/actions/notifications";
import TodayClient from "./TodayClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TodayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, city")
    .eq("id", user!.id)
    .single();

  const city     = profile?.city ?? "Islamabad";
  const userName = profile?.full_name?.split(" ")[0] ?? "Friend";

  const [prayerMeta, todayLogs, stats, notificationsEnabled] = await Promise.all([
    getPrayerTimesWithMeta(city),
    getTodayLogs(),
    getUserStats(),
    getNotificationsEnabled(),
  ]);

  const onboardingComplete = stats?.onboarding_complete ?? false;

  return (
    <TodayClient
      userId={user!.id}
      userName={userName}
      prayerTimes={prayerMeta.prayers}
      prayerTimezone={prayerMeta.timezone}
      prayerDateGregorian={prayerMeta.dateGregorian}
      todayLogs={todayLogs}
      stats={stats}
      notificationsEnabled={notificationsEnabled}
      onboardingComplete={onboardingComplete}
    />
  );
}
