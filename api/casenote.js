import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { transcript, client: clientName } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Transcript missing" });
    }

    const prompt = `
You are a youth development coach writing case notes.

Format:
Headline: COACHING
YDC involved [client] in a [activity] to [purpose]...
Include 2–4 concise sentences about observations or client progress.
Next Step: [clear, practical next action].

Transcript: ${transcript}
Client: ${clientName || "N/A"}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.status(200).json({
      note: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("Error in casenote API:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

