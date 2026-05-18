import { getStore } from "@netlify/blobs";

export default async function handler(req, context) {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  }

  try {
    const store = getStore("events");
    await store.delete(id);

    const raw = await store.get("index");
    const index = raw ? JSON.parse(raw) : [];
    await store.set("index", JSON.stringify(index.filter((e) => e.id !== id)));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export const config = { path: "/api/deleteEvent" };
