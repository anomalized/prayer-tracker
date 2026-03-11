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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set in environment" }, { status: 500, headers: CORS });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 350,
        system: `You are a knowledgeable and respectful Islamic scholar. Explain the given Quranic ayah in 3-4 sentences of plain, warm English. Cover: what it means, its spiritual lesson, and brief context if relevant. No bullet points. Do not start with "This ayah".`,
        messages: [{
          role: "user",
          content: `Surah ${surahNumber} (${surahName}), Ayah ${ayahNumber}:\nTranslation: "${translation}"\n\nExplain this ayah simply and clearly.`
        }]
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return NextResponse.json({ error: `Anthropic error ${anthropicRes.status}: ${errText}` }, { status: anthropicRes.status, headers: CORS });
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text ?? "Unable to generate explanation.";
    return NextResponse.json({ text }, { headers: CORS });

  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500, headers: CORS });
  }
}