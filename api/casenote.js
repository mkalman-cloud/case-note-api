// api/casenote.js
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export default async function handler(req, res) {
  // ---------- CORS (Allow your GitHub Pages app) ----------
  res.setHeader("Access-Control-Allow-Origin", "https://mkalman-cloud.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    // Preflight request — return immediately
    return res.status(200).end();
  }
  // --------------------------------------------------------

  // Reject non-POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // Ensure API key exists
  if (!openai) {
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  // Parse request body safely
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const { transcript = "", client = "" } = body;

  if (!transcript.trim()) {
    return res.status(400).json({ error: "Transcript missing" });
  }

  // Prompt system for generating YDC-style case notes
  const systemPrompt = `
You are an assistant that writes professional youth development case notes in this format:

Headline: COACHING
YDC involved [client] in a conversation about [topic]. [Write what was discussed briefly in 2-4 sentences, person-centred and factual].
Next Step: [Write the next follow-up step].

Keep tone factual, concise, and clear.
  `.trim();

  const userPrompt = `
Transcript:
${transcript}

Client: ${client || "the young person"}
  `.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const note = completion.choices?.[0]?.message?.content?.trim();
    if (!note) {
      return res.status(502).json({ error: "Empty AI response" });
    }

    return res.status(200).json({ note });
  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(500).json({
      error: error?.message || "Error generating case note"
    });
  }
}
