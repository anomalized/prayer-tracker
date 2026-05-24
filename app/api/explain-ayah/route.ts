import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
    }

    // Rate Limiting (Cookie-based Cooldown)
    const lastCall = req.cookies.get("last_api_call")?.value;
    const now = Date.now();
    if (lastCall && now - parseInt(lastCall) < 5000) {
      return NextResponse.json({ error: "Too Many Requests. Please wait a few seconds." }, { status: 429, headers: CORS });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: CORS });
    }

    const { arabic, translation, surahName, surahNumber, ayahNumber } = body;

    // Validate inputs
    if (
      typeof arabic !== 'string' || arabic.length > 2000 ||
      typeof translation !== 'string' || translation.length > 2000 ||
      typeof surahName !== 'string' || surahName.length > 100 ||
      typeof surahNumber !== 'number' || surahNumber < 1 || surahNumber > 114 ||
      typeof ayahNumber !== 'number' || ayahNumber < 1 || ayahNumber > 6236
    ) {
      return NextResponse.json({ error: "Invalid payload or parameters too large." }, { status: 400, headers: CORS });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set in environment" }, { status: 500, headers: CORS });
    }

    // model can be overridden for experimentation; pick a current-supported
    // flavor from the listModels output if you ever need to change it.
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // prompt now emphasizes returning the entire verse with no truncation
    const prompt = `You are an expert Arabic–Urdu translator who produces full, authentic Qurʾānic translations. Given the Arabic text and English rendering below, output the complete Urdu translation of the ayah exactly as it would appear in a standard Urdu Qurʾān.

Do **not** truncate or abbreviate. There is no word limit; provide every word necessary for a proper translation. Do not add commentary, synonyms, or explanations — just the Urdu text itself in a single, continuous sentence.

Maintain a reverent and poetic tone to match the peach/floral theme.

Surah ${surahNumber} (${surahName}), Ayah ${ayahNumber}:
Translation: "${translation}"

Return only the Urdu translation, nothing else.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json(
        { error: `Gemini error ${geminiRes.status}: ${errText}` },
        { status: geminiRes.status, headers: CORS }
      );
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate explanation.";
    
    const res = NextResponse.json({ text }, { headers: CORS });
    res.cookies.set("last_api_call", now.toString(), { path: "/", maxAge: 5 });
    return res;

  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500, headers: CORS });
  }
}