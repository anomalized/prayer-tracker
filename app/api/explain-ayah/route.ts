import { NextRequest, NextResponse } from "next/server";

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
    const { arabic, translation, surahName, surahNumber, ayahNumber } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set in environment" }, { status: 500, headers: CORS });
    }

    // model can be overridden for experimentation; pick a current-supported
    // flavor from the listModels output if you ever need to change it.
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // new requirement: return a proper, valid and authentic Urdu translation
    const prompt = `You are a fluent Arabic–Urdu translator with deep respect for Qurʾānic language. Instead of providing an explanation, give a correct, eloquent Urdu rendering of the ayah that a native Urdu speaker would recognize as authentic and beautiful.

Do not include commentary, tafsir, or additional sentences – only the translation itself. Keep the tone reverent and poetic, matching the peach/floral aesthetic of the app.

Surah ${surahNumber} (${surahName}), Ayah ${ayahNumber}:
Translation: "${translation}"

Provide the Urdu text alone.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 450,
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
    return NextResponse.json({ text }, { headers: CORS });

  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500, headers: CORS });
  }
}