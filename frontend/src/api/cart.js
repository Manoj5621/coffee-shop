// src/api/add-to-cart.js
const BASE_URL = "http://localhost:8000/";
const user_id = localStorage.getItem("user_id") // Replace with actual user ID logic

export function viewCart(user_id) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Filter cart for this user
  const userCartItems = cart.filter(item => item.user_id === user_id);

  if (userCartItems.length === 0) {
    return [];
  }

  // Group by product_id and sum quantities
  const productQuantities = {};
  userCartItems.forEach(item => {
    const pid = item.product_id;
    if (productQuantities[pid]) {
      productQuantities[pid].quantity += item.quantity || 1;
    } else {
      productQuantities[pid] = {
        quantity: item.quantity || 1,
        _id: item.cart_item_id || Date.now().toString(), // mimic unique id
        // Store product details here too so we don't need a DB call
        name: item.name,
        price: item.price,
        image: item.image || "",
        type: item.type || "",
        description: item.description || ""
      };
    }
  });

  // Convert grouped data into final array format
  const result = Object.entries(productQuantities).map(([product_id, info]) => ({
    product_id,
    name: info.name,
    price: info.price,
    image: info.image,
    type: info.type,
    description: info.description,
    quantity: info.quantity,
    total: info.price * info.quantity,
    cart_item_id: info._id
  }));

  return result;
}


// Other functions remain the same but use /api prefix

export async function checkout(user_id) {
  console.log("[DEBUG] Checkout started for user_id:", user_id);

  // Get all items for this user from localStorage
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  console.log("[DEBUG] Full cart from localStorage:", cart);

  const userCartItems = cart.filter(item => item.user_id === user_id);
  console.log("[DEBUG] Filtered userCartItems:", userCartItems);

  // Prepare the payload with product_id and quantity
  const items = userCartItems.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity || 1,
    name: item.name,
    price: item.discount_price ||0,
    image: item.image || "",
    type: item.type || "",
    description: item.description || ""
  }));

  console.log("[DEBUG] Items payload to send:", items);

  const payload = { user_id, items };
  console.log("[DEBUG] Final payload for checkout API:", payload);

  try {
    const res = await fetch(`${BASE_URL}api/checkout`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload), // send both user_id and cart items
    });

    console.log("[DEBUG] Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[DEBUG] Checkout API Error Response:", errorText);
      throw new Error("Checkout failed");
    }

    const data = await res.json();
    console.log("[DEBUG] Checkout API Success Response:", data);
    return data;

  } catch (err) {
    console.error("[DEBUG] Checkout function error:", err);
    throw err;
  }
}


export function addToCart(productId, itemDetails) {
  const user_id = localStorage.getItem("user_id"); // still keep per-user cart if needed

  // Get existing cart from localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Check if the item already exists in cart
  const existingItemIndex = cart.findIndex(
    (item) => item.user_id === user_id && item.product_id === productId
  );

  if (existingItemIndex >= 0) {
    // If item exists, increase quantity
    cart[existingItemIndex].quantity += 1;
  } else {
    // Add new item
    cart.push({
      user_id,
      product_id: productId,
      quantity: 1,
      ...itemDetails
    });
  }

  // Save updated cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  // Return the updated cart
  return cart;
}



export async function getOrderHistory(user_id) {
  const res = await fetch(`${BASE_URL}/order-history/${user_id}`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!res.ok) throw new Error("Failed to fetch order history");
  return await res.json();
}