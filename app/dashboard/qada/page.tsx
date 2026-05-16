import { getQadaStats } from "@/lib/actions/qada";
import QadaTracker from "@/components/qada/QadaTracker";
import MenuButton from "@/components/ui/MenuButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function QadaPage() {
  const stats = await getQadaStats();

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ background: "#fdf6f3" }}>
      <div
        className="px-5 pt-12 md:pt-6 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #f5e6df 0%, #f0d8ce 60%, #ecddd6 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-40" style={{ background: "#e8c4b8" }} />
        <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={false} />

        <p className="font-body text-[10px] tracking-widest text-nude-400 uppercase mb-1 relative z-10">
          Makeup Prayers
        </p>
        <h1 className="font-display text-3xl font-bold text-nude-700 mb-1 relative z-10">
          Qada Tracker 🤲
        </h1>
        <p className="font-body text-sm text-nude-500 relative z-10">
          Log your missed prayers, one at a time
        </p>
      </div>

      <div className="px-4 py-4">
        <QadaTracker initialStats={stats} />
      </div>
    </div>
  );
}
