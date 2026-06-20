const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore JSON parse failure, use default message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchSessions() {
  const res = await fetch(`${API_BASE_URL}/sessions`);
  return handleResponse(res);
}

export async function fetchSessionEvents(sessionId) {
  const res = await fetch(`${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/events`);
  return handleResponse(res);
}

export async function fetchPages() {
  const res = await fetch(`${API_BASE_URL}/pages`);
  return handleResponse(res);
}

export async function fetchHeatmapData(pageUrl) {
  const res = await fetch(`${API_BASE_URL}/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`);
  return handleResponse(res);
}
