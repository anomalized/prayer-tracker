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

    const prompt = `You are a knowledgeable and respectful Islamic scholar. Explain this Quranic ayah in 3-4 sentences of plain, warm English. Cover what it means, its spiritual lesson, and brief context if relevant. No bullet points. Do not start with "This ayah".

Surah ${surahNumber} (${surahName}), Ayah ${ayahNumber}:
Translation: "${translation}"

Explain this ayah simply and clearly.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 350,
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