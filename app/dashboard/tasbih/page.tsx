import TasbihCounter from "@/components/tasbih/TasbihCounter";

// No server data needed — all state is client-side localStorage
// Still mark dynamic to prevent static generation (auth layout wraps this)
export const dynamic = "force-dynamic";

export default function TasbihPage() {
  return <TasbihCounter />;
}
