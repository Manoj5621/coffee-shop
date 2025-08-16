const BASE_URL = "http://localhost:8000/api";

// ✅ Get all orders
export async function getAllOrders() {
  const res = await fetch(`${BASE_URL}/admin/orders`);
  return await res.json();
}

// ✅ Mark an order as completed
export async function markOrderCompleted(order_id) {
  const res = await fetch(`${BASE_URL}/admin/mark-completed/${order_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    }
  });
  return await res.json();
}

// ✅ Cancel an order
export async function cancelOrder(order_id) {
  const res = await fetch(`${BASE_URL}/admin/cancel-order/${order_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    }
  });
  return await res.json();
}

// ✅ Get dashboard statistics (orders, revenue, etc.)
export async function getOrderStats() {
  const res = await fetch(`${BASE_URL}/admin/stats`);
  return await res.json();
}

// ✅ Get most popular products for dashboard
export async function getPopularProducts() {
  const res = await fetch(`${BASE_URL}/admin/products`);
  return await res.json();
}


