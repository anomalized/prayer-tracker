import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReflectionClient from "./ReflectionClient";

export const dynamic = "force-dynamic";

export default async function ReflectionPage({ 
  params 
}: { 
  params: { prayer: string } 
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const prayerName = decodeURIComponent(params.prayer);
  const today = new Date().toISOString().split("T")[0];

  const { data: log } = await supabase
    .from("prayers")
    .select("id, status, note, dhikr, duas")
    .eq("user_id", user.id)
    .eq("prayer_name", prayerName)
    .eq("date", today)
    .single();

  return (
    <ReflectionClient
      prayerName={prayerName}
      prayerLog={log ?? null}
    />
  );
}