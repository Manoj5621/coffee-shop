// OrderHistoryPage.js
import React, { useEffect, useState } from "react";
import { getOrderHistory } from "../api/cart";
import { motion, AnimatePresence } from "framer-motion";
import './OrderHistoryPage.css';

function OrderHistoryPage() {
  const user_id = "user_id"; // Replace with real user_id
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getOrderHistory(user_id).then((data) => {
      setOrders(data || []);
      setIsLoading(false);
    });
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const statusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'completed': return '#4CAF50';
      case 'preparing': return '#FFC107';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="order-history-container">
      {/* Coffee steam animation background (same as cart page) */}
      <div className="coffee-steam-animation">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="steam-particle" style={{ 
            left: `${10 + i * 25}%`,
            animationDelay: `${i * 0.5}s`
          }}></div>
        ))}
      </div>
      
      <motion.div 
        className="order-history-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Your Coffee Orders</h2>
        <div className="coffee-cup-icon">☕</div>
      </motion.div>

      {isLoading ? (
        <motion.div 
          className="loading-orders"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="coffee-brewing-animation">
            <div className="coffee-cup"></div>
            <div className="coffee-liquid"></div>
          </div>
          <p>Brewing your order history...</p>
        </motion.div>
      ) : orders.length === 0 ? (
        <motion.div
          className="no-orders-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="empty-order-icon">
            <div className="coffee-stain"></div>
            <div className="receipt-icon">📃</div>
          </div>
          <h3>No Orders Yet</h3>
          <p>Your coffee adventures haven't started yet!</p>
        </motion.div>
      ) : (
        <motion.div
          className="orders-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.order_id}
                className="order-card"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <div className="order-header">
                  <h3 className="order-id">Order #{order.order_id}</h3>
                  <div 
                    className="order-status"
                    style={{ backgroundColor: statusColor(order.status) }}
                  >
                    {order.status}
                  </div>
                </div>
                
                <div className="order-details">
                  <div className="order-meta">
                    <p className="order-date">
                      <span className="meta-icon">📅</span>
                      {new Date(order.timestamp).toLocaleString()}
                    </p>
                    <p className="order-total">
                      <span className="meta-icon">💰</span>
                      ₹{order.total_amount}
                    </p>
                  </div>
                  
                  <div className="order-items">
                    <h4>Your Brews:</h4>
                    <ul>
                      {order.items.map((item, index) => (
                        <li key={index} className="order-item">
                          <div className="item-image">
                            <img 
                              src={item.image || 'https://via.placeholder.com/50x50?text=Coffee'} 
                              alt={item.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/50x50?text=Coffee';
                              }}
                            />
                          </div>
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">x{item.quantity}</span>
                            {item.size && (
                              <span className="item-size">{item.size.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="item-price">₹{item.subtotal}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="order-footer">
                  <button className="reorder-btn">
                    Reorder
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export default OrderHistoryPage;