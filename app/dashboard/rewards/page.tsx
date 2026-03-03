import { getBadges } from "@/lib/actions/badges";
import { getUserStats } from "@/lib/actions/prayers";
import { createClient } from "@/lib/supabase/server";
import RewardsClient from "./RewardsClient";

export default async function RewardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [badges, stats] = await Promise.all([
    getBadges(user!.id),
    getUserStats(),
  ]);

  return <RewardsClient badges={badges} stats={stats} />;
}
