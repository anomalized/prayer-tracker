import { createClient } from "@/lib/supabase/server";
import { getPrayerTimes } from "@/lib/prayerTimes";
import { getTodayLogs, getUserStats } from "@/lib/actions/prayers";
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

  const [prayerTimes, todayLogs, stats] = await Promise.all([
    getPrayerTimes(city),
    getTodayLogs(),
    getUserStats(),
  ]);

  return (
    <TodayClient
      userName={userName}
      prayerTimes={prayerTimes}
      todayLogs={todayLogs}
      stats={stats}
    />
  );
}
