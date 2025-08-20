import React, { useEffect, useRef, useState } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import ProductListing from './ProductListing';
import './ProductListing.css';
import ChatbotPage from './ChatbotPage'; // Assuming you have a ChatbotPage component

// Image imports (you'll need to download and place these in your project)
import coffeeBg from './assets/coffee-bg.jpg';
import coffeeBeans from './assets/coffee-beans.jpg';
import coffeeShop from './assets/coffee-shop.jpg';
import barista from './assets/barista.jpg';
import coffeeCup from './assets/coffee-cup.jpg';
import chatbotIcon from './assets/chatbot-icon.png';
import jamesWilson from './assets/james-wilson.jpg';
import mariaGarcia from './assets/maria-garcia.jpg';
import thomasLee from './assets/thomas-lee.jpg';


const CoffeeHouse = ({ name }) => {
  // Refs for each section
  const homeRef = useRef(null);
  const menuRef = useRef(null);
  const blogRef = useRef(null);
  const aboutRef = useRef(null);
  const shopRef = useRef(null);
  const contactRef = useRef(null);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Chatbot state
  const [showChatbotPopup, setShowChatbotPopup] = useState(false);
  const [isChatbotAnimating, setIsChatbotAnimating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

useEffect(() => {
  // Check if token and user_id exist in localStorage
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');
  setIsLoggedIn(!!token && !!userId);
}, []);
  
  // Shop status logic
  const [shopStatus, setShopStatus] = React.useState({
    isOpen: false,
    openingTime: '8:00 AM',
    closingTime: '8:00 PM',
    currentTime: new Date().toLocaleTimeString(),
    location: '123 Coffee Street, Brew City'
  });

  // Sample reviews data
  const [reviews] = React.useState([
    { id: 1, name: 'Sarah Johnson', rating: 5, comment: 'Best coffee in town! The atmosphere is wonderful.' },
    { id: 2, name: 'Michael Chen', rating: 4, comment: 'Great service and delicious pastries. Will come again!' },
    { id: 3, name: 'Emma Williams', rating: 5, comment: 'My favorite place to work remotely. Excellent WiFi and coffee.' },
    { id: 4, name: 'David Kim', rating: 3, comment: 'Good coffee but a bit pricey. Nice ambiance though.' },
    { id: 5, name: 'Lisa Rodriguez', rating: 5, comment: 'The baristas are so friendly! Love their seasonal drinks.' }
  ]);

  // Function to render star ratings
  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[...Array(5)].map((_, i) => (
          <span key={i} style={{ color: i < rating ? 'gold' : 'gray' }}>★</span>
        ))}
      </div>
    );
  };

  // Update time and check if shop is open
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const isOpen = currentHour >= 8 && currentHour < 20; // 8AM to 8PM
      
      setShopStatus(prev => ({
        ...prev,
        isOpen,
        currentTime: now.toLocaleTimeString()
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to section function
  const scrollToSection = (ref, section) => {
    setActiveSection(section);
    window.scrollTo({
      top: ref.current.offsetTop,
      behavior: 'smooth'
    });
  };

  // Update active section based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { ref: homeRef, name: 'home' },
        { ref: menuRef, name: 'menu' },
        { ref: blogRef, name: 'blog' },
        { ref: aboutRef, name: 'about' },
        { ref: shopRef, name: 'shop' },
        { ref: contactRef, name: 'contact' }
      ];

      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        if (section.ref.current && scrollPosition >= section.ref.current.offsetTop) {
          setActiveSection(section.name);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Chatbot animation and interaction
  useEffect(() => {
    // Initial animation after component mounts
    const timer = setTimeout(() => {
      setIsChatbotAnimating(true);
      setShowChatbotPopup(true);
      
      // Hide the popup after 5 seconds
      setTimeout(() => {
        setShowChatbotPopup(false);
      }, 5000);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

   const handleChatbotClick = () => {
  setShowChatbot(!showChatbot);
  setShowChatbotPopup(false);
};

  const handleChatbotHover = () => {
    setShowChatbotPopup(true);
  };

  const handleChatbotLeave = () => {
    setShowChatbotPopup(false);
  };

  const handleRecommendedCoffee = (coffeeName) => {
  // Send the recommended coffee name to the main product listing page
  window.postMessage({
    type: 'CHATBOT_RECOMMENDATION',
    coffee: coffeeName
  }, '*');
};

  // Home section images for the gallery
  const homeImages = [
    { src: coffeeBeans, alt: 'Fresh coffee beans', caption: 'Premium Quality Beans' },
    { src: coffeeShop, alt: 'Coffee shop interior', caption: 'Cozy Atmosphere' },
    { src: barista, alt: 'Barista making coffee', caption: 'Expert Baristas' },
    { src: coffeeCup, alt: 'Artistic coffee cup', caption: 'Beautiful Presentation' }
  ];

  return (
    <div className="coffee-shop-container">
      {/* Background with coffee-themed elements */}
      <div className="coffee-background" style={{ backgroundImage: `url(${coffeeBg})` }}>
        {[...Array(8)].map((_, i) => <div key={i} className="coffee-bean"></div>)}
      </div>
      
      {/* Chatbot Button */}

<div className="chatbot-container">
  <div 
    className={`chatbot-button ${isChatbotAnimating ? 'pulse' : ''}`}
    onClick={handleChatbotClick}
    onMouseEnter={handleChatbotHover}
    onMouseLeave={handleChatbotLeave}
  >
    <img src={chatbotIcon} alt="Chatbot" className="chatbot-icon" />
    {showChatbotPopup && (
      <div className="chatbot-popup">
        <div className="chatbot-speech-bubble">Can I help you?</div>
      </div>
    )}
  </div>

  {showChatbot && (
    <div className="chatbot-window">
      <ChatbotPage /> {/* This will be your existing chatbot component */}
    </div>
  )}
</div>
      
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="brand-first">Brew</span>
          <span className="brand-second">Haven</span>
          <div className="brand-divider"></div>
        </div>
        <div className="nav-links">
          <button 
            className={activeSection === 'home' ? 'active' : ''}
            onClick={() => scrollToSection(homeRef, 'home')}
          >
            Home
          </button>
          <button 
            className={activeSection === 'menu' ? 'active' : ''}
            onClick={() => scrollToSection(menuRef, 'menu')}
          >
            Menu
          </button>
          <button 
            className={activeSection === 'blog' ? 'active' : ''}
            onClick={() => scrollToSection(blogRef, 'blog')}
          >
            Blog
          </button>
          <button 
            className={activeSection === 'about' ? 'active' : ''}
            onClick={() => scrollToSection(aboutRef, 'about')}
          >
            About
          </button>
          <button 
            className={activeSection === 'shop' ? 'active' : ''}
            onClick={() => scrollToSection(shopRef, 'shop')}
          >
            Shop
          </button>
          <button 
            className={activeSection === 'contact' ? 'active' : ''}
            onClick={() => scrollToSection(contactRef, 'contact')}
          >
            Contact
          </button>
<div className="nav-actions">
  <Link to="/cart" className="cart-link">
    <i className="fas fa-shopping-cart"></i> Cart
  </Link>
  {isLoggedIn ? (
    <button 
      className="auth-link"
      onClick={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        setIsLoggedIn(false);
        // Optional: redirect to home after logout
        navigate('/');
      }}
    >
      Logout
    </button>
  ) : (
    <>
      <Link to="/auth/signup" className="auth-link">SignUp</Link>
      <Link to="/auth/login" className="auth-link">Login</Link>
    </>
  )}
  <Link to="/admin" className="admin-link">Admin</Link>
</div>
        </div>
      </nav>

      {/* Home Section */}
      <section ref={homeRef} id="home" className="dashboard-section home-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Welcome to {name || 'Brew Haven'}</h1>
          <p className="hero-subtitle">Artisanal Coffee & Cozy Atmosphere</p>
        </div>
        
        <div className="swiper-container">
          <Swiper
            modules={[Autoplay, Pagination, EffectFade]}
            spaceBetween={30}
            effect="fade"
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000 }}
            className="dashboard-swiper"
          >
            <SwiperSlide style={{ backgroundImage: `url(${coffeeBeans})` }}>
              <div className="swiper-slide-content">
                <h3>Discover Our Special Blends</h3>
                <p>Artisanal coffee crafted with care</p>
              </div>
            </SwiperSlide>
            <SwiperSlide style={{ backgroundImage: `url(${coffeeShop})` }}>
              <div className="swiper-slide-content">
                <h3>Seasonal Favorites</h3>
                <p>Try our limited-time offerings</p>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
        
        {/* Image Gallery */}
        <div className="image-gallery">
          {homeImages.map((image, index) => (
            <div key={index} className="gallery-item">
              <img src={image.src} alt={image.alt} />
              <div className="gallery-caption">{image.caption}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Menu Section */}
      <section ref={menuRef} id="menu" className="dashboard-section menu-section">
        <div className="section-header">
          <h2>Our Menu</h2>
          <div className="section-divider"></div>
        </div>
        
        {/* Product Listing Component */}
        <div className="products-wrapper">
          <ProductListing />
        </div>
      </section>

      {/* Blog Section */}
      <section ref={blogRef} id="blog" className="dashboard-section blog-section">
        <div className="section-header">
          <h2>Latest Posts</h2>
          <div className="section-divider"></div>
        </div>
        <div className="blog-posts">
          <article className="blog-post">
            <div className="post-image" style={{ backgroundImage: `url(${barista})` }}></div>
            <div className="post-content">
              <h3>The Art of Coffee Making</h3>
              <p>Learn about our traditional brewing techniques passed down through generations of baristas.</p>
              <button className="read-more">Read More</button>
            </div>
          </article>
          <article className="blog-post">
            <div className="post-image" style={{ backgroundImage: `url(${coffeeCup})` }}></div>
            <div className="post-content">
              <h3>New Seasonal Drinks</h3>
              <p>Discover our winter specials featuring cinnamon, nutmeg, and other warm spices.</p>
              <button className="read-more">Read More</button>
            </div>
          </article>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} id="about" className="dashboard-section about-section">
        <div className="section-header">
          <h2>Our Story</h2>
          <div className="section-divider"></div>
        </div>
        <div className="about-content">
          <div className="about-text">
            <p>Founded in 2010, Brew Haven has been serving quality coffee sourced directly from ethical growers around the world.</p>
            <p>Our mission is to create a community space where people can enjoy exceptional coffee in a warm, welcoming environment.</p>
          </div>
 <div className="team-section">
  <h3>Meet Our Team</h3>
  <p>Our expert baristas bring passion and precision to every cup.</p>
  <div className="team-members">
    <div className="team-member">
      <div className="member-image" style={{ backgroundImage: `url(${jamesWilson})` }}></div>
      <h4>James Wilson</h4>
      <p>Head Barista</p>
      <div className="member-social">
        <a href="#"><i className="fab fa-instagram"></i></a>
        <a href="#"><i className="fab fa-twitter"></i></a>
      </div>
    </div>
    <div className="team-member">
      <div className="member-image" style={{ backgroundImage: `url(${mariaGarcia})` }}></div>
      <h4>Maria Garcia</h4>
      <p>Pastry Chef</p>
      <div className="member-social">
        <a href="#"><i className="fab fa-instagram"></i></a>
        <a href="#"><i className="fab fa-twitter"></i></a>
      </div>
    </div>
    <div className="team-member">
      <div className="member-image" style={{ backgroundImage: `url(${thomasLee})` }}></div>
      <h4>Thomas Lee</h4>
      <p>Coffee Roaster</p>
      <div className="member-social">
        <a href="#"><i className="fab fa-instagram"></i></a>
        <a href="#"><i className="fab fa-twitter"></i></a>
      </div>
    </div>
  </div>
</div>
        </div>
      </section>

      {/* Shop Section */}
      <section ref={shopRef} id="shop" className="dashboard-section shop-section">
        <div className="section-header">
          <h2>Visit Us</h2>
          <div className="section-divider"></div>
        </div>
        <div className="shop-info">
          <div className="shop-status">
            <div className="status-card">
              <h3>Location & Hours</h3>
              <p><i className="fas fa-map-marker-alt"></i> <strong>Address:</strong> {shopStatus.location}</p>
              <p><i className="fas fa-clock"></i> <strong>Current Time:</strong> {shopStatus.currentTime}</p>
              <p><i className="fas fa-door-open"></i> <strong>Hours:</strong> {shopStatus.openingTime} - {shopStatus.closingTime}</p>
              <p className={`status-indicator ${shopStatus.isOpen ? 'open' : 'closed'}`}>
                <i className={`fas ${shopStatus.isOpen ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                <strong>Status:</strong> {shopStatus.isOpen ? 'Open Now' : 'Currently Closed'}
              </p>
              <button className="directions-btn">
                <i className="fas fa-directions"></i> Get Directions
              </button>
            </div>
          </div>
          
          {/* Reviews Section */}
          <div className="reviews">
            <h3>What Our Customers Say</h3>
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar">
                      {review.name.charAt(0)}
                    </div>
                    <div className="review-info">
                      <h4>{review.name}</h4>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} id="contact" className="dashboard-section contact-section">
        <div className="section-header">
          <h2>Get In Touch</h2>
          <div className="section-divider"></div>
        </div>
        <div className="contact-container">
          <div className="contact-info">
            <div className="contact-card">
              <h3>Contact Information</h3>
              <p><i className="fas fa-phone"></i> <strong>Phone:</strong> (123) 456-7890</p>
              <p><i className="fas fa-envelope"></i> <strong>Email:</strong> contact@brewhaven.com</p>
              <p><i className="fas fa-map-marker-alt"></i> <strong>Address:</strong> {shopStatus.location}</p>
              <div className="social-links">
                <a href="#"><i className="fab fa-facebook"></i></a>
                <a href="#"><i className="fab fa-instagram"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
              </div>
            </div>
          </div>
          <form className="contact-form">
            <h3>Send Us a Message</h3>
            <div className="form-group">
              <input type="text" placeholder="Your Name" required />
            </div>
            <div className="form-group">
              <input type="email" placeholder="Your Email" required />
            </div>
            <div className="form-group">
              <textarea placeholder="Your Message" rows="5" required></textarea>
            </div>
            <button type="submit" className="submit-btn">
              <i className="fas fa-paper-plane"></i> Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="coffee-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span>Brew</span>
            <span>Haven</span>
            <p>Artisanal Coffee Experience</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#menu">Menu</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#shop">Shop</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <p>123 Coffee Street, Brew City</p>
            <p>contact@brewhaven.com</p>
            <p>(123) 456-7890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Brew Haven. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CoffeeHouse;