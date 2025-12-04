export default async function handler(req, res) {
  // Basic CORS so your app can call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const body = req.body || {};
    const messages = body.messages || [];
    const profile = body.profile || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY env var" });
    }

    // How we want the coach to behave
    const systemPrompt = `
You are MindBowling’s AI Bowling Coach.
Be practical, concise, and encouraging.
Always reply in this structure:

1) Immediate Lane Adjustments (max 3 bullet points)
2) Drills for the Week (2–3 drills)
3) Equipment Notes (only if meaningful)

Never give medical or injury advice. If the user mentions pain or injury,
tell them to see a qualified coach or medical professional.
Use any profile info (average, speed, rev rate, handedness, pattern, ball, etc.) when helpful.
`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: "User profile: " + JSON.stringify(profile) },
      // Convert our client messages to the OpenAI shape
      ...messages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text || m.content || ""
      }))
    ];

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: chatMessages,
        temperature: 0.6,
        max_tokens: 600
      })
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      return res.status(502).json({ error: "OpenAI error", details: errText });
    }

    const data = await openaiResp.json();
    const text = data.choices?.[0]?.message?.content || "No response";

    // Simple response for your app
    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}
