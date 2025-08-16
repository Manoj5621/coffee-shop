export const BASE_URL = "http://localhost:8000";

export async function addProduct(product) {
  const res = await fetch(`${BASE_URL}/api/add-product`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  return await res.json();
}

export async function getAllProducts() {
  const res = await fetch(`${BASE_URL}/api/products`);
  const data = await res.json();
  // Ensure we always return an array
  return Array.isArray(data) ? data : [];
}
export async function getProductTypes() {
  const res = await fetch(`${BASE_URL}/api/product-types`);
  return await res.json();
}
