// ─── User ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  city?: string;
  created_at: string;
}

// ─── Prayers ─────────────────────────────────────────────────────────────────

export type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
export type PrayerStatus = "ontime" | "late" | "missed";

export interface PrayerLog {
  id: string;
  user_id: string;
  prayer_name: PrayerName;
  date: string;           // YYYY-MM-DD
  status: PrayerStatus;
  note?: string;
  created_at: string;
}

export interface PrayerTime {
  name: PrayerName;
  arabic: string;
  time: string;           // e.g. "5:12 AM"
  icon: string;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface UserStats {
  user_id: string;
  total_points: number;
  current_streak: number;
  best_streak: number;
  last_active_date: string | null;
  // tracks if the introductory onboarding has been finished
  onboarding_complete?: boolean;
  // number of available streak freezes (0-3)
  streak_freeze_count?: number;
}

export type Rank = "Bronze" | "Silver" | "Gold" | "Diamond";

// ─── Badges ──────────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  earned: boolean;
  earned_at?: string;
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export type FriendshipStatus = "pending" | "accepted" | "rejected";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export type FriendActivityType = "prayer" | "qada" | "badge";

export interface FriendActivity {
  id: string;
  friend_id: string;
  friend_name: string;
  activity_type: FriendActivityType;
  title: string;
  subtitle: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
