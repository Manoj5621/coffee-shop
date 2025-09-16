import React, { useEffect, useState } from 'react';
import { getAllProducts, getProductTypes } from '../api/product';
import './ProductListing.css';
import { addToCart, viewCart, checkout } from '../api/cart';

function ProductListing() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [orderStatus, setOrderStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [cartCount, setCartCount] = useState(0);
  const [sugarOptions, setSugarOptions] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [selectedSugar, setSelectedSugar] = useState({});
  const [customizations, setCustomizations] = useState({});

  const handleSugarSelect = (productId, sugarLevel) => {
  setSugarOptions(prev => ({
    ...prev,
    [productId]: sugarLevel
  }));
};

const handleDescriptionChange = (productId, description) => {
  setDescriptions(prev => ({
    ...prev,
    [productId]: description
  }));
};

// const updatedCartData = {
//   size,
//   name: product.name,
//   image: product.image,
//   price: finalPrice,
//   quantity: 1,
//   sugar: sugarOptions[productId] || 'with sugar',
//   specialInstructions: descriptions[productId] || ''
// };

// Add these to your useEffect where you initialize sizes
useEffect(() => {
  if (products.length > 0) {
    const sizes = {};
    const sugarOpts = {...sugarOptions};
    const descs = {};
    
    products.forEach(product => {
      sizes[product.product_id] = 'medium';
      if (!sugarOpts[product.product_id]) {
        sugarOpts[product.product_id] = 'with sugar';
      }
      descs[product.product_id] = '';
    });
    
    setSelectedSizes(sizes);
    setSugarOptions(sugarOpts);
    setDescriptions(descs);
  }
}, [products]);

  useEffect(() => {
    loadProducts();
    loadProductTypes();
    loadCartCount();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedType, searchTerm]);

  useEffect(() => {
  const handleChatbotRecommendation = (event) => {
    if (event.data.type === 'CHATBOT_RECOMMENDATION' && event.data.coffee) {
      setSearchTerm(event.data.coffee);
      
      // Optional: Scroll to the recommended product section
      setTimeout(() => {
        const element = document.querySelector('.coffee-search');
        if (element) element.focus();
      }, 100);
    }
  };

  window.addEventListener('message', handleChatbotRecommendation);
  
  return () => {
    window.removeEventListener('message', handleChatbotRecommendation);
  };
}, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getAllProducts();
      const sortedData = Array.isArray(data) ? 
        data.sort((a, b) => a.name === "Classic Coffee" ? -1 : b.name === "Classic Coffee" ? 1 : 0) : [];
      setProducts(sortedData);
      
      const sizes = {};
      sortedData.forEach(product => {
        sizes[product.product_id] = 'medium';
      });
      setSelectedSizes(sizes);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductTypes = async () => {
    try {
      const response = await getProductTypes();
      setTypes(response.types || []);
    } catch (error) {
      console.error('Failed to load product types:', error);
      setTypes([]);
    }
  };

  const loadCartCount = async () => {
    try {
      let user_id = localStorage.getItem("user_id");
      const cartData = await viewCart(user_id);
      if (cartData && Array.isArray(cartData.cart)) {
        setCartCount(cartData.cart.length);
      }
    } catch (error) {
      console.error('Failed to load cart count:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    if (selectedType !== 'all') {
      filtered = filtered.filter(product => product.type === selectedType);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        (product.description && product.description.toLowerCase().includes(term))
      );
    }
    setFilteredProducts(filtered);
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  // Calculate price based on size selection
  const calculatePrice = (product, size) => {
    const basePrice = product.discount_price || product.price;
    
    switch(size) {
      case 'small':
        return (basePrice * 0.7).toFixed(2); // 30% discount for small
      case 'medium':
        return basePrice; // Regular price for medium
      case 'large':
        return (basePrice * 1.25).toFixed(2); // 25% premium for large
      default:
        return basePrice;
    }
  };

const handleBuyNow = async (productId) => {
  try {
    const size = selectedSizes[productId];
    const product = products.find(p => p.product_id === productId);
    const user_id = localStorage.getItem("user_id");
    
    // Calculate the final price based on size
    const finalPrice = calculatePrice(product, size);
    
    // Add to cart first
    await addToCart(productId, { 
      size,
      name: product.name,
      image: product.image,
      price: finalPrice,
      quantity: 1,
      sugar: sugarOptions[productId] || 'with sugar',
      specialInstructions: descriptions[productId] || ''
    });
    
    // Then call checkout API
    const checkoutResult = await checkout(user_id);
    
    setOrderStatus({ 
      productId, 
      message: 'Order placed successfully! Your coffee is being prepared.', 
      isBuyNow: true 
    });

    const buyButton = document.getElementById(`buy-btn-${productId}`);
    if (buyButton) {
      buyButton.classList.add('animate-buy');
      setTimeout(() => buyButton.classList.remove('animate-buy'), 500);
    }

    setTimeout(() => setOrderStatus(null), 3000);
    loadCartCount();
    localStorage.setItem("cart", JSON.stringify(null));
  } catch (error) {
    console.error('Failed to place order:', error);
    setOrderStatus({ 
      productId, 
      message: 'Failed to place order. Please try again.', 
      error: true 
    });
    setTimeout(() => setOrderStatus(null), 3000);
  }
};

const handleAddToCart = async (productId) => {
  try {
    const size = selectedSizes[productId] || 'medium';
    const sugar = sugarOptions[productId] || 'with sugar';
    const customization = descriptions[productId] || '';
    const product = products.find(p => p.product_id === productId);
    
    // Calculate the final price based on size
    const finalPrice = calculatePrice(product, size);
    
    await addToCart(productId, { 
      size,
      sugar,
      customization,
      name: product.name,
      image: product.image,
      price: product.discount_price || product.price,
      quantity: 1
    });
    
    setOrderStatus({ 
      productId, 
      message: 'Added to your cart!', 
      isAddToCart: true 
    });

    const cartButton = document.getElementById(`cart-btn-${productId}`);
    if (cartButton) {
      cartButton.classList.add('animate-add');
      setTimeout(() => cartButton.classList.remove('animate-add'), 500);
    }

    setTimeout(() => setOrderStatus(null), 3000);
    loadCartCount();
  } catch (error) {
    console.error('Failed to add to cart:', error);
    setOrderStatus({ 
      productId, 
      message: 'Failed to add to cart. Please try again.', 
      error: true 
    });
    setTimeout(() => setOrderStatus(null), 3000);
  }
};

  return (
    <div className="coffee-shop-container">
      <div className="coffee-background">
        {[...Array(8)].map((_, i) => <div key={i} className="coffee-bean"></div>)}
      </div>

      <header className="coffee-header">
        <div className="navigation-tabs">
          <button 
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
        
             ☕︎
          </button>
        </div>

        {activeTab === 'menu' && (
          <>
            <div className="search-container">
              <div className="coffee-cup-icon">☕︎</div>
              <input
                type="text"
                placeholder="Search our menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="coffee-search"
              />
            </div>

            <div className="coffee-tabs">
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="coffee-filter"
              >
                <option value="all">All Menu Items</option>
                {types.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </header>

      {isLoading ? (
        <div className="loading-coffee">
          <div className="coffee-cup-loading"></div>
          <p>Brewing our finest selections...</p>
        </div>
      ) : (
        <main>
          {orderStatus && (
            <div className={`order-status ${orderStatus.error ? 'error' : orderStatus.isBuyNow ? 'buy-now' : 'add-cart'}`}>
              {orderStatus.message}
            </div>
          )}

          <div className="product-grid">
            {types.map(type => (
              <section key={type} className="product-section fade-in">
                {(selectedType === 'all' || selectedType === type) && (
                  <>
                    <h2 className="coffee-type-title">
                      <span className="coffee-bean-icon">🌱</span>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                      <span className="coffee-bean-icon">🌱</span>
                    </h2>
                    <div className="products-row">
                      {filteredProducts
                        .filter(product => product.type === type)
                        .map(product => (
                          <div key={product.product_id} className="product-card">
                            <div className="product-image-container">
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="product-image"
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.src = 'https://via.placeholder.com/200x200?text=Coffee+Image';
                                }}
                              />
                            </div>
                            <div className="product-details">
                              <h3 className="product-name">{product.name}</h3>
                              <div className="price-container">
                                <span className="size-price">
                                  ${calculatePrice(product, selectedSizes[product.product_id])}
                                  <span className="size-label">
                                    ({selectedSizes[product.product_id].toUpperCase()})
                                  </span>
                                </span>
                                {product.discount_price && selectedSizes[product.product_id] === 'medium' && (
                                  <span className="original-price">${product.price}</span>
                                )}
                              </div>
                              <p className="product-description">{product.description}</p>

                              <div className="size-selector">
                                <button 
                                  className={`size-btn ${selectedSizes[product.product_id] === 'small' ? 'active' : ''}`}
                                  onClick={() => handleSizeSelect(product.product_id, 'small')}
                                  title="Small - 30% off"
                                >
                                  S
                                  <span className="size-price-hint">${calculatePrice(product, 'small')}</span>
                                </button>
                                <button 
                                  className={`size-btn ${selectedSizes[product.product_id] === 'medium' ? 'active' : ''}`}
                                  onClick={() => handleSizeSelect(product.product_id, 'medium')}
                                  title="Medium - Regular price"
                                >
                                  M
                                  <span className="size-price-hint">${calculatePrice(product, 'medium')}</span>
                                </button>
                                <button 
                                  className={`size-btn ${selectedSizes[product.product_id] === 'large' ? 'active' : ''}`}
                                  onClick={() => handleSizeSelect(product.product_id, 'large')}
                                  title="Large - 25% more"
                                >
                                  L
                                  <span className="size-price-hint">${calculatePrice(product, 'large')}</span>
                                </button>
                              </div>

                              {/* Sugar Options */}
                              <div className="sugar-selector">
                                <button 
                                  className={`sugar-btn ${sugarOptions[product.product_id] === 'with sugar' ? 'active' : ''}`}
                                  onClick={() => handleSugarSelect(product.product_id, 'with sugar')}
                                >
                                  With Sugar
                                </button>
                                <button 
                                  className={`sugar-btn ${sugarOptions[product.product_id] === 'without sugar' ? 'active' : ''}`}
                                  onClick={() => handleSugarSelect(product.product_id, 'without sugar')}
                                >
                                  No Sugar
                                </button>
                                <button 
                                  className={`sugar-btn ${sugarOptions[product.product_id] === 'extra sugar' ? 'active' : ''}`}
                                  onClick={() => handleSugarSelect(product.product_id, 'extra sugar')}
                                >
                                  Extra Sugar
                                </button>
                              </div>

                              {/* Special Instructions */}
                            <div className="instructions-container">
                              <textarea
                                placeholder="Special instructions (optional)"
                                value={descriptions[product.product_id] || ''}
                                onChange={(e) => handleDescriptionChange(product.product_id, e.target.value)}
                                className="instructions-input"
                                rows="2"
                                maxLength="100"
                              />
                              <div className="char-count">
                                {descriptions[product.product_id] ? descriptions[product.product_id].length : 0}/100
                              </div>
                            </div>

                              <div className="action-buttons">
                                <button 
                                  id={`buy-btn-${product.product_id}`}
                                  onClick={() => handleBuyNow(product.product_id)}
                                  className="buy-now-btn"
                                >
                                  Buy Now
                                </button>
                                <button 
                                  id={`cart-btn-${product.product_id}`}
                                  onClick={() => handleAddToCart(product.product_id)}
                                  className="add-to-cart-btn"
                                >
                                  Add to Cart
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </section>
            ))}

            {products.some(p => !p.type) && (
              <section className="product-section fade-in">
                <h2 className="coffee-type-title">
                  <span className="coffee-bean-icon">🌱</span>
                  Other Delights
                  <span className="coffee-bean-icon">🌱</span>
                </h2>
                <div className="products-row">
                  {filteredProducts
                    .filter(product => !product.type)
                    .map(product => (
                      <div key={product.product_id} className="product-card">
                        <div className="product-image-container">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="product-image"
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = 'https://via.placeholder.com/200x200?text=Coffee+Image';
                            }}
                          />
                        </div>
                        <div className="product-details">
                          <h3 className="product-name">{product.name}</h3>
                          <div className="price-container">
                            <span className="size-price">
                              ${calculatePrice(product, selectedSizes[product.product_id])}
                              <span className="size-label">
                                ({selectedSizes[product.product_id].toUpperCase()})
                              </span>
                            </span>
                            {product.discount_price && selectedSizes[product.product_id] === 'medium' && (
                              <span className="original-price">${product.price}</span>
                            )}
                          </div>
                          <p className="product-description">{product.description}</p>

                          {(product.name.toLowerCase().includes('coffee') || 
                            product.name.toLowerCase().includes('latte') || 
                            product.name.toLowerCase().includes('cappuccino')) && (
                            <div className="size-selector">
                              <button 
                                className={`size-btn ${selectedSizes[product.product_id] === 'small' ? 'active' : ''}`}
                                onClick={() => handleSizeSelect(product.product_id, 'small')}
                                title="Small - 30% off"
                              >
                                S
                                <span className="size-price-hint">${calculatePrice(product, 'small')}</span>
                              </button>
                              <button 
                                className={`size-btn ${selectedSizes[product.product_id] === 'medium' ? 'active' : ''}`}
                                onClick={() => handleSizeSelect(product.product_id, 'medium')}
                                title="Medium - Regular price"
                              >
                                M
                                <span className="size-price-hint">${calculatePrice(product, 'medium')}</span>
                              </button>
                              <button 
                                className={`size-btn ${selectedSizes[product.product_id] === 'large' ? 'active' : ''}`}
                                onClick={() => handleSizeSelect(product.product_id, 'large')}
                                title="Large - 25% more"
                              >
                                L
                                <span className="size-price-hint">${calculatePrice(product, 'large')}</span>
                              </button>
                            </div>
                          )}

                          <div className="action-buttons">
                            <button 
                              id={`buy-btn-${product.product_id}`}
                              onClick={() => handleBuyNow(product.product_id)}
                              className="buy-now-btn"
                            >
                              Buy Now
                            </button>
                            <button 
                              id={`cart-btn-${product.product_id}`}
                              onClick={() => handleAddToCart(product.product_id)}
                              className="add-to-cart-btn"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default ProductListing;