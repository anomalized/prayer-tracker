import { createClient } from "@/lib/supabase/server";
import NavProvider from "@/components/ui/NavProvider";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <NavProvider userName={profile?.full_name ?? ""} userEmail={user?.email ?? ""}>
      <div className="min-h-screen" style={{ background: "#fdf6f3" }}>
        {children}
      </div>
    </NavProvider>
  );
}