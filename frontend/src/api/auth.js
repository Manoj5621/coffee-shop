const BASE_URL = "http://localhost:8000/api";

// Helper function for safe fetch with error handling
async function safeFetch(url, options) {
  try {
    const res = await fetch(url, options);

    // Check if the response is not ok (status not in 200–299)
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "API error");
    }

    return await res.json();
  } catch (error) {
    console.error("❌ API error:", error.message);
    throw error; // Let the caller handle the error
  }
}

export async function signup(user) {
  return await safeFetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
}

export async function login(credentials) {
  return await safeFetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}
