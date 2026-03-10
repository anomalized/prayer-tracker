import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavProvider from "@/components/ui/NavProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch name for drawer header
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <NavProvider userName={profile?.full_name ?? ""} userEmail={user.email ?? ""}>
      <div className="min-h-screen" style={{ background: "#fdf6f3" }}>
        {children}
      </div>
    </NavProvider>
  );
}