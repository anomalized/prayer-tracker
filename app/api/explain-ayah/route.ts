import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { arabic, translation, surahName, surahNumber, ayahNumber } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      stream: true,
      system: `You are a knowledgeable and respectful Islamic scholar assistant.
When explaining a Quranic ayah, give:
1. A SHORT plain-English meaning (1-2 sentences, simple words)
2. The KEY spiritual lesson or message (1-2 sentences)
3. If relevant, brief context about when/why it was revealed (1 sentence max)
Keep the total explanation under 120 words. Use warm, accessible language.
Never start with "This ayah" — vary your opening. Write in flowing paragraphs, no bullet points.`,
      messages: [{
        role: "user",
        content: `Surah ${surahNumber} (${surahName}), Ayah ${ayahNumber}:\nArabic: ${arabic}\nTranslation: ${translation}\n\nExplain this ayah simply and clearly.`
      }]
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(err, { status: response.status });
  }

  // Stream the response directly to the client
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}