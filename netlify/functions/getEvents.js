import { getStore } from "@netlify/blobs";

export default async function handler(req, context) {
  try {
    const store = getStore("events");
    const raw = await store.get("index");
    const events = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export const config = { path: "/api/getEvents" };
