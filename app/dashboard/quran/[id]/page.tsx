import SurahReader from "./SurahReader";
import { SURAHS } from "@/lib/quran";

export function generateStaticParams() {
  return SURAHS.map(s => ({ id: String(s.number) }));
}

export default function SurahPage({ params }: { params: { id: string } }) {
  return <SurahReader surahNumber={parseInt(params.id)} />;
}