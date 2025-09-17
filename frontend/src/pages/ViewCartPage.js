import React, { useEffect, useState } from "react";
import { viewCart, checkout } from "../api/cart";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import './ViewCartPage.css';

function ViewCartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const user_id = localStorage.getItem("user_id");
  const navigate = useNavigate();

  useEffect(() => {
    const loadCart = async () => {
      try {
        const data = await viewCart(user_id);
        if (Array.isArray(data)) {
          setCartItems(data);
        } else if (data && Array.isArray(data.cart)) {
          setCartItems(data.cart);
        } else {
          setCartItems([]);
          console.error("Unexpected viewCart response:", data);
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartItems([]);
      }
    };

    loadCart();
  }, [user_id]);

const handleCheckout = async () => {
  try {
    setIsCheckingOut(true);
    const res = await checkout(user_id); // calls POST /checkout
    navigate("/payment");
    
    // Optional: redirect to /admin for testing
    // window.location.href = "/admin";
  } catch (error) {
    console.error("Checkout failed:", error);
    alert("Failed to place order");
  } finally {
    setIsCheckingOut(false);
  }
};


  const handleCancelOrder = () => {
    setOrderConfirmed(false);
    setShowCancelButton(false);
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.product_id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );
      
      // Update localStorage to match
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      return updatedItems;
    });
  };

  const removeItem = (productId) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.product_id !== productId);
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      return updatedItems;
    });
  };

  const total = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : 0;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    }),
    exit: { opacity: 0, x: -100 }
  };

  return (
    <div className="cart-page-container">
      <div className="coffee-steam-animation">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="steam-particle" style={{
            left: `${10 + i * 25}%`,
            animationDelay: `${i * 0.5}s`
          }}></div>
        ))}
      </div>

      <motion.div
        className="cart-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Your Coffee Cart</h2>
        <div className="coffee-cup-icon">☕</div>
      </motion.div>

      {cartItems.length === 0 ? (
        <motion.div
          className="empty-cart-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="empty-cup-animation">
            <div className="cup"></div>
            <div className="plate"></div>
          </div>
          <p>Your cart is empty. Time for some coffee!</p>
        </motion.div>
      ) : (
        <>
          <div className="cart-items-container">
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.product_id || index}
                  className="cart-item"
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={itemVariants}
                  layout
                >
                  <div className="item-image">
                    <img
                      src={item.image || 'https://via.placeholder.com/100x100?text=Coffee'}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/100x100?text=Coffee';
                      }}
                    />
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    {item.size && <p className="item-size">{item.size.toUpperCase()} size</p>}
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.product_id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, 1)}>+</button>
                    </div>
                  </div>
                  <div className="item-actions">
                    <div className="item-price">₹{item.price * item.quantity}</div>
                    <button className="remove-btn" onClick={() => removeItem(item.product_id)}>✕</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.div
            className="cart-total"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>Total:</span>
            <span className="total-amount">₹{total.toFixed(2)}</span>
          </motion.div>

          <div className="checkout-container">
            {orderConfirmed ? (
              <motion.div
                className="order-confirmed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <div className="confirmation-icon">✓</div>
                <h3>Order Confirmed!</h3>
                <p>Your coffee is being prepared</p>
                {showCancelButton && (
                  <motion.button
                    className="cancel-order-btn"
                    onClick={handleCancelOrder}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel Order
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.button
                className="order-button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCheckingOut ? 'Processing...' : 'Place Order'}
              </motion.button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ViewCartPage;