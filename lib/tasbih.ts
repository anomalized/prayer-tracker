// ─── Dhikr definitions ────────────────────────────────────────────────────────

export interface DhikrOption {
  id:              string;
  name:            string;
  arabic:          string;
  transliteration: string;
  translation:     string;
  defaultTarget:   number;
}

export const DHIKR_OPTIONS: DhikrOption[] = [
  {
    id:              "subhanallah",
    name:            "Subhanallah",
    arabic:          "سُبْحَانَ اللَّهِ",
    transliteration: "Subḥāna-llāh",
    translation:     "Glory be to Allah",
    defaultTarget:   33,
  },
  {
    id:              "alhamdulillah",
    name:            "Alhamdulillah",
    arabic:          "الْحَمْدُ لِلَّهِ",
    transliteration: "Al-ḥamdu li-llāh",
    translation:     "All praise be to Allah",
    defaultTarget:   33,
  },
  {
    id:              "allahuakbar",
    name:            "Allahu Akbar",
    arabic:          "اللَّهُ أَكْبَرُ",
    transliteration: "Allāhu Akbar",
    translation:     "Allah is the Greatest",
    defaultTarget:   34,
  },
  {
    id:              "astaghfirullah",
    name:            "Astaghfirullah",
    arabic:          "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfiru-llāh",
    translation:     "I seek forgiveness from Allah",
    defaultTarget:   100,
  },
  {
    id:              "lailahaillallah",
    name:            "La ilaha illallah",
    arabic:          "لَا إِلَهَ إِلَّا اللَّهُ",
    transliteration: "Lā ilāha illā-llāh",
    translation:     "There is no god but Allah",
    defaultTarget:   100,
  },
  {
    id:              "custom",
    name:            "Custom",
    arabic:          "",
    transliteration: "",
    translation:     "",
    defaultTarget:   33,
  },
];

export const PRESET_TARGETS = [33, 99, 100] as const;

// ─── Session log ──────────────────────────────────────────────────────────────

export interface TasbihSession {
  id:           string;
  dhikrId:      string;
  dhikrName:    string;
  dhikrArabic:  string;
  roundsCount:  number;       // how many complete rounds in this session
  totalCount:   number;       // total presses (rounds × target)
  target:       number;
  startedAt:    string;       // ISO
  completedAt:  string;       // ISO — last round completion time
}

export const LS_SESSIONS_KEY = "tasbih_sessions";
export const LS_CURRENT_KEY  = "tasbih_current";

// ─── Persisted current-session state ─────────────────────────────────────────

export interface TasbihCurrentState {
  dhikrId:      string;
  customText:   string;
  count:        number;
  target:       number;
  roundsToday:  number;
  startedAt:    string;
}
