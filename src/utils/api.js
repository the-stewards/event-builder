function getToken() {
  const user = window.netlifyIdentity?.currentUser();
  return user?.token?.access_token || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function fetchEvents() {
  const res = await fetch("/.netlify/functions/getEvents", {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchEvent(id) {
  const res = await fetch(`/.netlify/functions/getEvent?id=${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch event");
  return res.json();
}

export async function saveEvent(event) {
  const res = await fetch("/.netlify/functions/saveEvent", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to save event");
  return res.json();
}

export async function deleteEvent(id) {
  const res = await fetch("/.netlify/functions/deleteEvent", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete event");
  return res.json();
}
