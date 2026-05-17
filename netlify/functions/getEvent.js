import { getStore } from "@netlify/blobs";
import { validateAuth } from "./utils/validateAuth.js";

export default async function handler(req, context) {
  try {
    validateAuth(req.headers);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  }

  try {
    const store = getStore("events");
    const raw = await store.get(id);
    if (!raw) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    return new Response(raw, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export const config = { path: "/api/getEvent" };
