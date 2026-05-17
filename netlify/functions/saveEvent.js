import { getStore } from "@netlify/blobs";
import { validateAuth } from "./utils/validateAuth.js";

export default async function handler(req, context) {
  try {
    validateAuth(req.headers);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let event;
  try {
    event = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  if (!event?.id) {
    return new Response(JSON.stringify({ error: "Missing event id" }), { status: 400 });
  }

  try {
    const store = getStore("events");

    await store.set(event.id, JSON.stringify(event));

    const raw = await store.get("index");
    const index = raw ? JSON.parse(raw) : [];
    const entry = { id: event.id, name: event.name, date: event.date, status: event.status };
    const exists = index.findIndex((e) => e.id === event.id);
    if (exists >= 0) {
      index[exists] = entry;
    } else {
      index.push(entry);
    }
    await store.set("index", JSON.stringify(index));

    return new Response(JSON.stringify({ success: true, id: event.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export const config = { path: "/api/saveEvent" };
