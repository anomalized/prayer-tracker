import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavProvider from "@/components/ui/NavProvider";
import DesktopSidebar from "@/components/ui/DesktopSidebar"; // new — see CRIT-02

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <NavProvider userName={profile?.full_name ?? ""} userEmail={user.email ?? ""}>
      {/* Mobile: single column. Desktop: sidebar + content. */}
      <div
        className="min-h-screen md:grid md:grid-cols-[260px_1fr]"
        style={{ background: "var(--color-bg-primary)" }}
      >
        {/* Desktop sidebar — hidden on mobile */}
        <DesktopSidebar
          userName={profile?.full_name ?? ""}
          userEmail={user.email ?? ""}
        />
        {/* Main content: capped width on very wide screens */}
        <main className="min-h-screen w-full max-w-2xl md:max-w-none mx-auto">
          {children}
        </main>
      </div>
    </NavProvider>
  );
}