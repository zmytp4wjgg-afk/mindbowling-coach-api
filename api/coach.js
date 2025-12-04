export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const body = req.body;
    const messages = body.messages || [];
    const profile = body.profile || {};

    const systemPrompt = `
const chatMessages = [
  { role: "system", content: systemPrompt },
  { role: "system", content: "User profile: " + JSON.stringify(profile) },
  ...messages
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
    max_tokens: 500
  })
});

const json = await openaiResp.json();
const text = json.choices?.[0]?.message?.content || "No response";

res.status(200).send(text);
