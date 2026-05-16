import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrayerLog {
  prayer_name: "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
  date: string;        // YYYY-MM-DD
  status: "ontime" | "late" | "missed";
}

interface PrayerStats {
  name: string;
  ontime: number;
  late: number;
  missed: number;
  total: number;
  ontimeRate: number;  // 0–100
  completionRate: number; // ontime+late / total * 100
}

interface DayPattern {
  dayName: string;     // Monday, Tuesday …
  avgCompletion: number; // avg prayers completed 0–5
}

interface ProcessedInsight {
  prayerStats: PrayerStats[];
  weakestPrayer: PrayerStats;
  dayPatterns: DayPattern[];
  overallRate: number;       // % of all prayers completed (ontime or late)
  perfectDays: number;       // days with all 5 prayers
  totalDaysTracked: number;
  streakContext: string;     // human readable e.g. "improving over last 2 weeks"
}

interface InsightResponse {
  summary: string;
  focusPrayer: {
    name: string;
    missedCount: number;
    pattern: string;   // e.g. "most often missed on weekdays"
    ontimeRate: number;
  };
  tip: string;
  tipSource: string;
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─── Analytics pre-processor ──────────────────────────────────────────────────
// We do the number-crunching here, not inside the prompt.
// Gemini should reason about patterns, not perform arithmetic.

function processLogs(logs: PrayerLog[]): ProcessedInsight {
  const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
  const DAYS    = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  // ── Per-prayer breakdown ────────────────────────────────────────────────────
  const prayerStats: PrayerStats[] = PRAYERS.map((name) => {
    const pLogs = logs.filter((l) => l.prayer_name === name);
    const ontime = pLogs.filter((l) => l.status === "ontime").length;
    const late   = pLogs.filter((l) => l.status === "late").length;
    const missed = pLogs.filter((l) => l.status === "missed").length;
    const total  = pLogs.length;
    return {
      name,
      ontime,
      late,
      missed,
      total,
      ontimeRate:    total > 0 ? Math.round((ontime / total) * 100) : 0,
      completionRate: total > 0 ? Math.round(((ontime + late) / total) * 100) : 0,
    };
  });

  // ── Weakest prayer (lowest completionRate; tiebreak by missed count) ────────
  const weakestPrayer = [...prayerStats].sort((a, b) => {
    if (a.completionRate !== b.completionRate) return a.completionRate - b.completionRate;
    return b.missed - a.missed;
  })[0];

  // ── Day-of-week patterns ────────────────────────────────────────────────────
  // Map each date → how many prayers were completed that day
  const dateMap = new Map<string, number>();
  for (const log of logs) {
    if (log.status !== "missed") {
      dateMap.set(log.date, (dateMap.get(log.date) ?? 0) + 1);
    }
  }

  // Group completion counts by day-of-week
  const dayBuckets: Record<number, number[]> = {};
  for (const [dateStr, count] of Array.from(dateMap.entries())) {
    const dow = new Date(dateStr).getDay(); // 0=Sun … 6=Sat
    if (!dayBuckets[dow]) dayBuckets[dow] = [];
    dayBuckets[dow].push(count);
  }

  const dayPatterns: DayPattern[] = DAYS.map((dayName, i) => {
    const vals = dayBuckets[i] ?? [];
    const avg  = vals.length > 0
      ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
      : 0;
    return { dayName, avgCompletion: avg };
  });

  // ── Overall metrics ─────────────────────────────────────────────────────────
  const totalPossible = logs.length; // one log per prayer per day
  const totalDone     = logs.filter((l) => l.status !== "missed").length;
  const overallRate   = totalPossible > 0
    ? Math.round((totalDone / totalPossible) * 100)
    : 0;

  // Count days where all 5 prayers were completed
  const completionByDate = new Map<string, number>();
  for (const log of logs) {
    if (log.status !== "missed") {
      completionByDate.set(log.date, (completionByDate.get(log.date) ?? 0) + 1);
    }
  }
  const perfectDays = Array.from(completionByDate.values()).filter((v) => v === 5).length;

  // Unique dates in the dataset
  const uniqueDates     = new Set(logs.map((l) => l.date));
  const totalDaysTracked = uniqueDates.size;

  // ── Trend: compare first half vs second half of the period ─────────────────
  const sortedDates = Array.from(uniqueDates).sort();
  const midpoint    = Math.floor(sortedDates.length / 2);
  const firstHalf   = sortedDates.slice(0, midpoint);
  const secondHalf  = sortedDates.slice(midpoint);

  const rateForDates = (dates: string[]) => {
    const dateSet = new Set(dates);
    const subset  = logs.filter((l) => dateSet.has(l.date));
    if (!subset.length) return 0;
    return subset.filter((l) => l.status !== "missed").length / subset.length;
  };

  const firstRate  = rateForDates(firstHalf);
  const secondRate = rateForDates(secondHalf);
  const diff       = secondRate - firstRate;

  const streakContext =
    diff >  0.1 ? "showing clear improvement over the last two weeks" :
    diff < -0.1 ? "showing a slight decline compared to two weeks ago" :
                  "staying consistent across the full period";

  return {
    prayerStats,
    weakestPrayer,
    dayPatterns,
    overallRate,
    perfectDays,
    totalDaysTracked,
    streakContext,
  };
}

// ─── Weakest-prayer day pattern (human readable) ──────────────────────────────

function describeDayPattern(
  prayerName: string,
  logs: PrayerLog[],
  dayPatterns: DayPattern[]
): string {
  const pLogs  = logs.filter((l) => l.prayer_name === prayerName && l.status === "missed");
  if (!pLogs.length) return "no strong pattern detected";

  // Count misses per day-of-week
  const missesPerDay: Record<string, number> = {};
  for (const log of pLogs) {
    const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][
      new Date(log.date).getDay()
    ];
    missesPerDay[dayName] = (missesPerDay[dayName] ?? 0) + 1;
  }

  const sorted    = Object.entries(missesPerDay).sort((a, b) => b[1] - a[1]);
  const topDay    = sorted[0];
  const weekdays  = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const missedWd  = pLogs.filter((l) =>
    weekdays.includes(
      ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][
        new Date(l.date).getDay()
      ]
    )
  ).length;
  const missedWe  = pLogs.length - missedWd;
  const wdRatio   = pLogs.length > 0 ? missedWd / pLogs.length : 0;

  if (wdRatio > 0.7) return `most often missed on weekdays (${missedWd} of ${pLogs.length} misses)`;
  if (wdRatio < 0.3) return `most often missed on weekends (${missedWe} of ${pLogs.length} misses)`;
  return `most often missed on ${topDay[0]} (${topDay[1]} times in the period)`;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
// Structured prompting: persona → data → constraints → output contract.
// We pass processed numbers, not raw log arrays, so Gemini reasons not calculates.

function buildPrompt(insight: ProcessedInsight, logs: PrayerLog[]): string {
  const { prayerStats, weakestPrayer, dayPatterns, overallRate,
          perfectDays, totalDaysTracked, streakContext } = insight;

  const statsTable = prayerStats.map((p) =>
    `  ${p.name}: ${p.completionRate}% completed (${p.ontime} on-time, ${p.late} late, ${p.missed} missed out of ${p.total} days)`
  ).join("\n");

  const dayTable = dayPatterns.map((d) =>
    `  ${d.dayName}: average ${d.avgCompletion}/5 prayers completed`
  ).join("\n");

  const weakDayPattern = describeDayPattern(weakestPrayer.name, logs, dayPatterns);

  return `
You are a compassionate Islamic spiritual advisor helping a Muslim improve their prayer consistency. Your tone is warm, encouraging, and non-judgmental — like a knowledgeable older sibling who cares deeply. You never shame or lecture. You celebrate effort.

## User's Prayer Data (last ${totalDaysTracked} days)

Overall completion rate: ${overallRate}%
Perfect days (all 5 prayers): ${perfectDays} out of ${totalDaysTracked} days
Trend: ${streakContext}

Per-prayer breakdown:
${statsTable}

Day-of-week patterns:
${dayTable}

Most struggled prayer: ${weakestPrayer.name}
  - Completion rate: ${weakestPrayer.completionRate}%
  - On-time rate: ${weakestPrayer.ontimeRate}%
  - Missed ${weakestPrayer.missed} times
  - Pattern: ${weakDayPattern}

## Your Task

Return a JSON object with EXACTLY these four keys and no other text:

{
  "summary": "<2 sentences. Acknowledge their overall effort genuinely. Reference their exact overall rate and perfect-day count. End with a note about their trend (${streakContext}). Do not use the word 'journey'. Be specific, not generic.>",
  
  "focusPrayer": {
    "name": "${weakestPrayer.name}",
    "missedCount": ${weakestPrayer.missed},
    "pattern": "<1 sentence describing WHEN they miss this prayer based on the day pattern above. Be specific — mention the actual days or weekday/weekend split.>",
    "ontimeRate": ${weakestPrayer.ontimeRate}
  },
  
  "tip": "<One practical, specific tip for improving ${weakestPrayer.name} prayer. It must be grounded in Islamic tradition — reference the reward or virtue of this specific prayer from an authentic hadith. Make it actionable (e.g. set an alarm, pray immediately when the time enters, keep wudu). 2-3 sentences maximum.>",
  
  "tipSource": "<The hadith or Quranic reference for the tip above. Format as: 'Sahih Bukhari 123' or 'Surah Al-Isra 17:78' or similar. If citing a concept rather than a specific hadith, write the collection name.>"
}

Critical constraints:
- Return ONLY the JSON object. No markdown fences, no preamble, no explanation outside the JSON.
- All values must be strings (except missedCount and ontimeRate which are numbers).
- Do not invent hadith. Only cite authentic sources you are confident about.
- If ${weakestPrayer.name} is Fajr, reference the specific hadith about the two rak'ahs of Fajr sunnah or the angels witnessing Fajr.
- Keep the summary under 60 words total.
- Keep the tip under 60 words total.
`.trim();
}

// ─── Response validator ───────────────────────────────────────────────────────
// Gemini sometimes wraps JSON in markdown despite instructions.
// This strips it cleanly without regex fragility.

function extractJSON(raw: string): string {
  // Strip ```json ... ``` or ``` ... ``` fences if present
  const fenceStart = raw.indexOf("```");
  if (fenceStart !== -1) {
    const afterFence = raw.indexOf("\n", fenceStart) + 1;
    const fenceEnd   = raw.lastIndexOf("```");
    return raw.slice(afterFence, fenceEnd).trim();
  }
  // Find the outermost { } in case there's preamble text
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1).trim();
  return raw.trim();
}

function validateResponse(parsed: unknown): parsed is InsightResponse {
  if (typeof parsed !== "object" || parsed === null) return false;
  const p = parsed as Record<string, unknown>;

  if (typeof p.summary !== "string" || p.summary.length < 10) return false;
  if (typeof p.tip     !== "string" || p.tip.length < 10)     return false;
  if (typeof p.tipSource !== "string")                         return false;

  const fp = p.focusPrayer;
  if (typeof fp !== "object" || fp === null) return false;
  const f = fp as Record<string, unknown>;
  if (typeof f.name        !== "string") return false;
  if (typeof f.missedCount !== "number") return false;
  if (typeof f.pattern     !== "string") return false;
  if (typeof f.ontimeRate  !== "number") return false;

  return true;
}

// ─── Input validator ──────────────────────────────────────────────────────────

function validateInput(body: unknown): body is { logs: PrayerLog[] } {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.logs)) return false;
  if (b.logs.length === 0) return false;

  const VALID_PRAYERS  = new Set(["Fajr","Dhuhr","Asr","Maghrib","Isha"]);
  const VALID_STATUSES = new Set(["ontime","late","missed"]);

  return b.logs.every(
    (l: unknown) =>
      typeof l === "object" && l !== null &&
      typeof (l as PrayerLog).prayer_name === "string" &&
      VALID_PRAYERS.has((l as PrayerLog).prayer_name) &&
      typeof (l as PrayerLog).date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test((l as PrayerLog).date) &&
      VALID_STATUSES.has((l as PrayerLog).status)
  );
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  // ── 1. Parse & validate input ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS }
    );
  }

  if (!validateInput(body)) {
    return NextResponse.json(
      { error: "Request must include a non-empty `logs` array with valid prayer_name, date (YYYY-MM-DD), and status fields." },
      { status: 422, headers: CORS }
    );
  }

  // ── 2. Cap at 30 days, sorted most-recent first ─────────────────────────────
  const logs = [...body.logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 150); // 30 days × 5 prayers = 150 max entries

  // ── 3. Pre-process analytics ────────────────────────────────────────────────
  let insight: ProcessedInsight;
  try {
    insight = processLogs(logs);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Analytics processing failed: ${msg}` },
      { status: 500, headers: CORS }
    );
  }

  // Edge case: too few logs to generate meaningful insight
  if (insight.totalDaysTracked < 3) {
    return NextResponse.json(
      { error: "At least 3 days of prayer logs are needed to generate an insight." },
      { status: 422, headers: CORS }
    );
  }

  // ── 4. Check API key ────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
      { status: 500, headers: CORS }
    );
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  // ── 5. Build prompt & call Gemini ────────────────────────────────────────────
  const prompt = buildPrompt(insight, logs);

  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.4,     // lower = more consistent JSON structure
            topP: 0.8,
          },
        }),
      }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown network error";
    return NextResponse.json(
      { error: `Failed to reach Gemini API: ${msg}` },
      { status: 502, headers: CORS }
    );
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "(unreadable)");
    return NextResponse.json(
      { error: `Gemini error ${geminiRes.status}: ${errText.slice(0, 400)}` },
      { status: geminiRes.status, headers: CORS }
    );
  }

  // ── 6. Extract & parse JSON from Gemini response ─────────────────────────────
  let rawText: string;
  try {
    const data = await geminiRes.json();
    rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!rawText) throw new Error("Empty content from Gemini");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Parse error";
    return NextResponse.json(
      { error: `Could not read Gemini response: ${msg}` },
      { status: 502, headers: CORS }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJSON(rawText));
  } catch {
    // Return the raw text in development so you can debug the prompt
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Gemini returned non-JSON output.",
        ...(isDev && { rawGeminiOutput: rawText }),
      },
      { status: 502, headers: CORS }
    );
  }

  // ── 7. Validate shape before returning to client ──────────────────────────────
  if (!validateResponse(parsed)) {
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Gemini response was valid JSON but did not match expected schema.",
        ...(isDev && { rawParsed: parsed }),
      },
      { status: 502, headers: CORS }
    );
  }

  return NextResponse.json(parsed, { headers: CORS });
}