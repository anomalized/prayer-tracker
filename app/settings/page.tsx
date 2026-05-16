import { createClient } from "@/lib/supabase/server";
import { getNotificationsEnabled } from "@/lib/actions/notifications";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, notificationsEnabled] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, city")
      .eq("id", user!.id)
      .single(),
    getNotificationsEnabled(),
  ]);

  return (
    <SettingsClient
      userId={user!.id}
      fullName={profile?.full_name ?? ""}
      email={profile?.email ?? user?.email ?? ""}
      city={profile?.city ?? "Islamabad"}
      notificationsEnabled={notificationsEnabled}
    />
  );
}
