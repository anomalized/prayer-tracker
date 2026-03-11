import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { arabic, translation, surahName, surahNumber, ayahNumber } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500 });
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
      return new Response(JSON.stringify({ error: errText }), { status: anthropicRes.status });
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text ?? "Unable to generate explanation.";
    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}