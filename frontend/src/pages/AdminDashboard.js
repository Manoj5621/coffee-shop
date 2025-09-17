// AdminDashboard.js
import React, { useEffect, useState } from "react";
import { 
  getAllOrders, 
  markOrderCompleted, 
  cancelOrder,
  getOrderStats,
  getPopularProducts
} from "../api/admin";
import { 
  addProduct,
  getAllProducts,
  BASE_URL 
} from "../api/product";
import { motion } from "framer-motion";
import { FiCoffee, FiPackage, FiUsers, FiDollarSign, FiPlus } from "react-icons/fi";
import './AdminDashboard.css';
import { getContacts, updateContactStatus, deleteContact } from '../api/contact';
import { FiMessageSquare, FiMail, FiTrash2, FiEye, FiCornerUpRight } from 'react-icons/fi';

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showProductForm, setShowProductForm] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    image: "",
    price: "",
    discount_price: "",
    type: "",
    description: "",
    newType: ""
  });

  const loadContacts = async () => {
  try {
    setLoading(true);
    const data = await getContacts();
    setContacts(Array.isArray(data) ? data : []);
    setLoading(false);
  } catch (error) {
    console.error("Failed to load contacts:", error);
    setContacts([]);
    setLoading(false);
  }
};

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
    } else if (activeTab === "products") {
      loadProducts();
      loadProductTypes();
    } else if (activeTab === "dashboard") {
      loadDashboardData();
    }
    else if (activeTab === "contacts") {
      loadContacts();
    }
  }, [activeTab]);
  
  const handleMarkAsRead = async (contactId) => {
  try {
    await updateContactStatus(contactId, "read");
    loadContacts();
  } catch (error) {
    console.error("Failed to mark as read:", error);
  }
};

const handleMarkAsReplied = async (contactId) => {
  try {
    await updateContactStatus(contactId, "replied");
    loadContacts();
  } catch (error) {
    console.error("Failed to mark as replied:", error);
  }
};

const handleDeleteContact = async (contactId) => {
  if (window.confirm("Are you sure you want to delete this contact message?")) {
    try {
      await deleteContact(contactId);
      loadContacts();
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  }
};

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersData, statsData, popularData] = await Promise.all([
        getAllOrders(),
        getOrderStats(),
        getPopularProducts()
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
      setStats(statsData);
      setPopularProducts(Array.isArray(popularData) ? popularData : []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setPopularProducts([]);
      setLoading(false);
    }
  };

const loadOrders = async () => {
  try {
    setLoading(true);
    const data = await getAllOrders();
    setOrders(Array.isArray(data) ? data : []); // exactly same as dashboard
    setLoading(false);
  } catch (error) {
    console.error("Failed to load orders:", error);
    setOrders([]);
    setLoading(false);
  }
};


  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
      setLoading(false);
    }
  };

  const loadProductTypes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/product-types`);
      const data = await response.json();
      setProductTypes(data.types || []);
    } catch (error) {
      console.error("Failed to load product types:", error);
      setProductTypes([]);
    }
  };

  const handleComplete = async (order_id) => {
    try {
      await markOrderCompleted(order_id);
      loadOrders();
    } catch (error) {
      console.error("Failed to mark order complete:", error);
    }
  };

  const handleCancel = async (order_id) => {
    try {
      await cancelOrder(order_id);
      loadOrders();
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      image: "",
      price: "",
      discount_price: "",
      type: "",
      description: "",
      newType: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productType = formData.newType ? formData.newType : formData.type;

      const product = {
        name: formData.name,
        image: formData.image,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price
          ? parseFloat(formData.discount_price)
          : null,
        type: productType,
        description: formData.description
      };

      await addProduct(product);
      alert("Product added successfully!");
      
      resetForm();
      setShowProductForm(false);
      loadProducts();
      loadProductTypes();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    if (!status || typeof status !== "string") return "";
    switch (status.toLowerCase()) {
      case "completed": return "status-completed";
      case "pending": return "status-pending";
      case "cancelled": return "status-cancelled";
      case "preparing": return "status-preparing";
      default: return "";
    }
  };

const renderOrderRow = (order) => {
  return (
    <tr key={order._id}>
      <td>#{order._id ? order._id.slice(-6) : "N/A"}</td>
      <td>{order.user?.name || "Guest"}</td>
      <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</td>
      <td>
        {Array.isArray(order.items)
          ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0}
      </td>
      <td>{formatCurrency(order.total || 0)}</td>
      <td>
        <span className={`status-badge ${getStatusColor(order.status)}`}>
          {order.status || "Unknown"}
        </span>
      </td>
      {/* New columns for customization data */}
      <td>
        {Array.isArray(order.items) && order.items.length > 0 && (
          <div className="order-details">
            {order.items.map((item, index) => (
              <div key={index} className="item-detail">
                <strong>{item.name}</strong>
                <div>Size: {item.size || 'Medium'}</div>
                <div>Sugar: {item.sugar || 'Normal'}</div>
                {item.customization && (
                  <div>Notes: {item.customization}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </td>
      <td>
        {order.status?.toLowerCase().trim() === "pending" && (
          <>
            <button
              className="action-btn complete"
              onClick={() => handleComplete(order._id)}
            >
              Complete
            </button>
            <button
              className="action-btn cancel"
              onClick={() => handleCancel(order._id)}
            >
              Cancel
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <FiCoffee className="sidebar-icon" />
          <h2>Brew Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <FiCoffee /> Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <FiPackage /> Orders
          </button>
          <button 
            className={`nav-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <FiCoffee /> Products
          </button>
          <button 
            className={`nav-btn ${activeTab === "contacts" ? "active" : ""}`}
            onClick={() => setActiveTab("contacts")}
          >
            <FiMail /> Contacts
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {activeTab === "dashboard" && (
          <div className="dashboard-overview">
            <h2 className="dashboard-title">Coffee Shop Overview</h2>
            
            {loading ? (
              <div className="loading-indicator">
                <div className="coffee-brewing"></div>
                <p>Brewing your dashboard...</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon revenue">
                      <FiDollarSign />
                    </div>
                    <div className="stat-info">
                      <h3>Total Revenue</h3>
                      <p>{formatCurrency(stats.revenue)}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon orders">
                      <FiPackage />
                    </div>
                    <div className="stat-info">
                      <h3>Total Orders</h3>
                      <p>{stats.totalOrders}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon pending">
                      <FiPackage />
                    </div>
                    <div className="stat-info">
                      <h3>Pending Orders</h3>
                      <p>{stats.pendingOrders}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon completed">
                      <FiPackage />
                    </div>
                    <div className="stat-info">
                      <h3>Completed Orders</h3>
                      <p>{stats.completedOrders}</p>
                    </div>
                  </div>
                </div>

                <div className="dashboard-sections">
                  <div className="recent-orders">
                    <h3>Recent Orders</h3>
                    {orders.length === 0 ? (
                      <p>No recent orders</p>
                    ) : (
                      <div className="orders-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Name</th>
                              <th>Time/Date</th>
                              <th>Quantity</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map(renderOrderRow)}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="popular-products">
                    <h3>Popular Products</h3>
                    {popularProducts.length === 0 ? (
                      <p>No popular products data</p>
                    ) : (
                      <div className="products-grid">
                        {popularProducts.slice(0, 4).map((product) => (
                          <div key={product._id} className="popular-product">
                            <div className="product-image">
                              <img 
                                src={product.image || 'https://via.placeholder.com/100?text=Coffee'} 
                                alt={product.name}
                              />
                            </div>
                            <div className="product-info">
                              <h4>{product.name}</h4>
                              <p>Sold: {product.timesOrdered} times</p>
                              <p>Revenue: {formatCurrency(product.totalRevenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="orders-management">
            <div className="section-header">
              <h2>Orders Management</h2>
              <div className="order-filters">
                <select>
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-indicator">
                <div className="coffee-brewing"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <FiPackage className="empty-icon" />
                <p>No orders found</p>
              </div>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Customizations</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(renderOrderRow)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="products-management">
            <div className="section-header">
              <h2>Menu Management</h2>
              <button
                className="add-product-btn"
                onClick={() => {
                  resetForm();
                  setShowProductForm(true);
                }}
              >
                <FiPlus /> Add Menu Item
              </button>
            </div>

            {showProductForm && (
              <motion.div 
                className="product-form-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3>Add New Menu Item</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Item Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Cappuccino, Latte"
                    />
                  </div>

                  <div className="form-group">
                    <label>Item Image</label>
                    <div className="image-upload">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        required
                      />
                      {formData.image && (
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="image-preview"
                        />
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                        min="0"
                        placeholder="Regular price"
                      />
                    </div>

                    <div className="form-group">
                      <label>Discount Price (₹)</label>
                      <input
                        type="number"
                        name="discount_price"
                        value={formData.discount_price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select a category</option>
                      {productTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="newType"
                      value={formData.newType}
                      onChange={handleInputChange}
                      placeholder="Or create new category (e.g. Seasonal Specials)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      placeholder="Describe the item (ingredients, taste, etc.)"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-btn">
                      Add Menu Item
                    </button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => {
                        setShowProductForm(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {loading ? (
              <div className="loading-indicator">
                <div className="coffee-brewing"></div>
                <p>Loading menu items...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <FiCoffee className="empty-icon" />
                <p>No menu items found</p>
                <button
                  className="add-product-btn"
                  onClick={() => setShowProductForm(true)}
                >
                  <FiPlus /> Add Your First Item
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product._id} className="menu-item-card">
                    <div className="menu-item-image">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300?text=Coffee'} 
                        alt={product.name}
                      />
                    </div>
                    <div className="menu-item-info">
                      <h3>{product.name}</h3>
                      <p className="menu-item-category">{product.type || 'Uncategorized'}</p>
                      <p className="menu-item-description">{product.description}</p>
                      <div className="menu-item-pricing">
                        {product.discount_price ? (
                          <>
                            <span className="original-price">{formatCurrency(product.price)}</span>
                            <span className="discounted-price">{formatCurrency(product.discount_price)}</span>
                          </>
                        ) : (
                          <span className="regular-price">{formatCurrency(product.price)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="contacts-management">
            <div className="section-header">
              <h2>Contact Messages</h2>
            </div>

            {loading ? (
              <div className="loading-indicator">
                <div className="coffee-brewing"></div>
                <p>Loading messages...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="empty-state">
                <FiMail className="empty-icon" />
                <p>No contact messages found</p>
              </div>
            ) : (
              <div className="contacts-table-container">
                <table className="contacts-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Message</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.contact_id} className={`contact-row ${contact.status}`}>
                        <td>{contact.name}</td>
                        <td>
                          <a href={`mailto:${contact.email}`} className="email-link">
                            {contact.email}
                          </a>
                        </td>
                        <td className="message-cell">
                          <div className="message-preview">
                            {contact.message.length > 100 
                              ? `${contact.message.substring(0, 100)}...` 
                              : contact.message
                            }
                          </div>
                        </td>
                        <td>
                          {new Date(contact.submitted_at).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`status-badge status-${contact.status}`}>
                            {contact.status}
                          </span>
                        </td>
                        <td>
                          <div className="contact-actions">
                            {contact.status !== "read" && (
                              <button
                                className="action-btn read"
                                onClick={() => handleMarkAsRead(contact.contact_id)}
                                title="Mark as read"
                              >
                                <FiEye />
                              </button>
                            )}
                            {contact.status !== "replied" && (
                              <button
                                className="action-btn replied"
                                onClick={() => handleMarkAsReplied(contact.contact_id)}
                                title="Mark as replied"
                              >
                                <FiCornerUpRight />
                              </button>
                            )}
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteContact(contact.contact_id)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* {activeTab === "customers" && (
          <div className="customers-management">
            <h2>Customers Management</h2>
            <div className="coming-soon">
              <FiUsers className="coming-soon-icon" />
              <h3>Coming Soon</h3>
              <p>Customer management features are under development</p>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}

export default AdminDashboard;
