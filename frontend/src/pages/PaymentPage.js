import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentPage.css';
import { viewCart } from '../api/cart';

const BASE_URL = "http://localhost:8000/";

const PaymentPage = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // Add this function inside your Payment component (before the return statement)
const handleCheckout = async (user_id, items) => {
  console.log("[DEBUG] Checkout started for user_id:", user_id);
  console.log("[DEBUG] Items payload to send:", items);

  const BASE_URL = "http://localhost:8000/"; // Make sure to define this
  
  const payload = { user_id, items };
  console.log("[DEBUG] Final payload for checkout API:", payload);

  try {
    const res = await fetch(`${BASE_URL}api/checkout`, { // Removed /api/ prefix
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload),
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
};

  useEffect(() => {
    // Simulate loading cart data
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(cartData);
    
    // Calculate totals
    const calculatedSubtotal = cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedTax = calculatedSubtotal * 0.08; // 8% tax
    const calculatedTotal = calculatedSubtotal + calculatedTax;
    
    setSubtotal(calculatedSubtotal);
    setTax(calculatedTax);
    setTotal(calculatedTotal);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    
    // Add spaces for better readability
    if (value.length > 12) {
      value = value.replace(/(\d{4})(\d{4})(\d{4})(\d+)/, '$1 $2 $3 $4');
    } else if (value.length > 8) {
      value = value.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3');
    } else if (value.length > 4) {
      value = value.replace(/(\d{4})(\d+)/, '$1 $2');
    }
    
    setFormData(prev => ({
      ...prev,
      cardNumber: value
    }));
  };

  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    
    if (value.length > 2) {
      value = value.replace(/(\d{2})(\d+)/, '$1/$2');
    }
    
    setFormData(prev => ({
      ...prev,
      expiryDate: value
    }));
  };

        const handleSubmit = async (e) => {
          e.preventDefault();
          setIsProcessing(true);
          
          try {
            // Prepare items for checkout with customization details
            const checkoutItems = cartItems.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              name: item.name,
              price: item.price,
              image: item.image,
              type: item.type,
              description: item.description,
              size: item.size || 'medium',
              sugar: item.sugar || 'normal',
              customization: item.customization || ''
            }));
            
            // Call the checkout function
            await handleCheckout(localStorage.getItem("user_id"), checkoutItems);
            
            setIsProcessing(false);
            setIsSuccess(true);
            
            // Clear cart after successful payment
            localStorage.removeItem('cart');
            
            // Redirect to home after 3 seconds
            setTimeout(() => {
            navigate('/');
            }, 3000);
            
        } catch (error) {
            console.error('Failed to process payment:', error);
            setIsProcessing(false);
            // Handle error (show error message to user)
        }
    };

  if (isSuccess) {
    return (
      <div className="payment-success-container">
        <div className="success-animation">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2>Payment Successful!</h2>
          <p>Your order is being prepared. You'll receive a confirmation email shortly.</p>
          <div className="coffee-brewing">
            <div className="coffee-cup">
              <div className="coffee"></div>
              <div className="steam">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>
          <p>Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page-container">
      <div className="coffee-pattern-background"></div>
      
      <div className="payment-content">
        <div className="payment-header">
          <h1>Checkout</h1>
          <div className="progress-bar">
            <div className="progress-step active">
              <div className="step-number">1</div>
              <span>Cart</span>
            </div>
            <div className="progress-step active">
              <div className="step-number">2</div>
              <span>Details</span>
            </div>
            <div className="progress-step active">
              <div className="step-number">3</div>
              <span>Payment</span>
            </div>
            <div className="progress-step">
              <div className="step-number">4</div>
              <span>Complete</span>
            </div>
          </div>
        </div>

        <div className="payment-body">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-items">
              {cartItems.map(item => (
                <div key={item.product_id} className="order-item">
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>Size: {item.size}</p>
                    <div className="item-price">${item.price} x {item.quantity}</div>
                  </div>
                  <div className="item-total">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="payment-form-container">
            <form onSubmit={handleSubmit} className="payment-form">
              <div className="payment-methods">
                <h3>Payment Method</h3>
                <div className="method-options">
                  <div 
                    className={`method-option ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <i className="fas fa-credit-card"></i>
                    <span>Credit Card</span>
                  </div>
                  <div 
                    className={`method-option ${paymentMethod === 'paypal' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <i className="fab fa-paypal"></i>
                    <span>PayPal</span>
                  </div>
                  <div 
                    className={`method-option ${paymentMethod === 'googlepay' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('googlepay')}
                  >
                    <i className="fab fa-google-pay"></i>
                    <span>Google Pay</span>
                  </div>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="card-form">
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleExpiryDateChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="3"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      name="cardholderName"
                      value={formData.cardholderName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="contact-info">
                <h3>Contact Information</h3>
                <div className="form-group">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your UPI ID here!"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(123) 456-7890"
                    required
                  />
                </div>
              </div>

              <div className="shipping-info">
                <h3>Shipping Address</h3>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Coffee Street"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Brew City"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className={`pay-now-btn ${isProcessing ? 'processing' : ''}`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  `Pay $${total.toFixed(2)}`
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;