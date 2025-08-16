const BASE_URL = "http://localhost:8000";

export async function askMood(mood) {
  const res = await fetch(`${BASE_URL}/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mood }),
  });
  return await res.json();
}
