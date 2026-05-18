import { validateAuth } from "./utils/validateAuth.js";

export default async function handler(req, context) {
  try {
    validateAuth(req.headers);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { debrief, event } = body;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are an event debrief assistant for The Stewards, a mortgage advisory team in Columbus, Ohio run by Ryan Miracle and Chris Beal. Write a concise, professional 150-word debrief summary paragraph based on the event data provided. Tone: direct, warm, forward-looking. No bullet points. Past tense.`,
      messages: [
        {
          role: "user",
          content: `Event: ${event.name} on ${event.date} at ${event.venue}.
Capacity: ${event.capacity}. RSVPs confirmed: ${debrief.rsvpCount}. Attended: ${debrief.attendedCount}.
Revenue: ${debrief.revenueActual}. Expenses: ${debrief.expenseActual}. Net: ${(debrief.revenueActual || 0) - (debrief.expenseActual || 0)}.
NPS Score: ${debrief.npsScore}/10.
Wins: ${(debrief.wins || []).filter(Boolean).join("; ")}.
Misses: ${(debrief.misses || []).filter(Boolean).join("; ")}.
Do differently next time: ${(debrief.nextTime || []).filter(Boolean).join("; ")}.
Write the debrief summary paragraph.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: "AI call failed", detail: err }), { status: 502 });
  }

  const data = await response.json();
  return new Response(JSON.stringify({ summary: data.content[0].text }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { path: "/api/generateDebrief" };
