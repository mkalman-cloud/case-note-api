// Vercel Serverless Function: POST /api/casenote
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  try {
    cors(res);

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST /api/casenote" });
    }

    if (!openai) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing on server" });
    }

    // ---- Safe body parsing (handles string/empty bodies) ----
    let body = req.body;
    if (typeof body === "string" && body.trim().length) {
      try { body = JSON.parse(body); } catch (_) {}
    }
    if (!body || typeof body !== "object") body = {};

    const { transcript = "", client = "" } = body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: "Missing transcript" });
    }

    const system = `
You write youth development case notes in this style:
- Begin with "Headline: COACHING"
- Next: "YDC involved [client] in a [activity] to [purpose]..."
- Add 2–4 concise sentences of observations (affect, needs, shifts).
- Add "Outcomes:" line if relevant.
- Always finish with "Next step:" line.
Professional, factual, non-judgemental.
`.trim();

    const clientName = client || "the young person";
    const user = `Transcript:\n${transcript}\nClient: ${clientName}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    const note = completion.choices?.[0]?.message?.content?.trim() || "";
    if (!note) return res.status(502).json({ error: "Empty response from model" });

    return res.status(200).json({ note });
  } catch (err) {
    console.error("casenote error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
