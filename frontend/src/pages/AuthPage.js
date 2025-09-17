import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signup, login } from "../api/auth";
import { motion, AnimatePresence } from "framer-motion";
import "./AuthPage.css";

function AuthPage({ initialMode = "login" }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(initialMode === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    setIsSignup(path === "signup");
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const user = { email, password, name };

    try {
      const response = isSignup
        ? await signup(user)
        : await login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user_id', response.user_id || "static-user-id");
      localStorage.setItem('user_role', response.user_role || "user");

      if (isSignup) {
        setShowSuccessPopup(true);
        setEmail("");
        setPassword("");
        setName("");
        setTimeout(() => {
          setShowSuccessPopup(false);
          navigate("/auth/login");
        }, 3000);
      } else {
        setShowLoginPopup(true);
        setTimeout(() => {
          setShowLoginPopup(false);
          let user_role = localStorage.getItem("user_role");
          if (user_role == "admin"){
            navigate("/admin")
          }
          else{
          navigate("/");
          }
        }, 3000);
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  const handleSwitchMode = () => {
    if (isSignup) {
      navigate("/auth/login");
    } else {
      navigate("/auth/signup");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      } 
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const popupVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        type: "spring",
        damping: 10,
        stiffness: 100
      } 
    },
    exit: { scale: 0.8, opacity: 0 }
  };

  return (
    <motion.div
      className="auth-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated coffee beans background at the top */}
      <div className="animated-beans-bg" style={{ top: 0 }}>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="animated-bean"
            initial={{ 
              y: Math.random() * 100,
              x: Math.random() * 100,
              rotate: Math.random() * 360,
              opacity: 0.2
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 8 + Math.random() * 5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            className="popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="success-popup"
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div 
                className="animated-coffee-icon success"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              <h3>Account Created Successfully!</h3>
              <p>Your coffee journey begins now. Redirecting to login...</p>
              <div className="coffee-spinner"></div>
            </motion.div>
          </motion.div>
        )}

        {showLoginPopup && (
          <motion.div
            className="popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="login-popup"
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div 
                className="animated-coffee-icon welcome"
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              <h3>Welcome Back, Coffee Lover!</h3>
              <p>Brewing your perfect experience...</p>
              <div className="coffee-spinner"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="auth-card"
        variants={itemVariants}
      >
        <div className="coffee-header">
          <motion.div
            className="coffee-cup"
            animate={{ 
              y: [0, -5, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 4 
            }}
          >
            <div className="cup"></div>
            <div className="steam">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="steam-particle"
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ 
                    y: -30, 
                    opacity: [0, 0.8, 0],
                    scale: [1, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 0.5 * i,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          </motion.div>

          <h2 className="auth-title">
            {isSignup ? "Join Our Coffee Club" : "Welcome Back"}
          </h2>
          <p className="auth-subtitle">
            {isSignup ? "Create an account to start your coffee journey" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {isSignup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="input-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} 
                    className="coffee-input"
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="coffee-input"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="coffee-input"
              required
            />
          </div>

          <motion.button
            type="submit"
            className="coffee-btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : isSignup ? "Create New Account" : "Sign In"}
          </motion.button>

          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </form>

        <motion.div className="auth-switch">
          <span>
            {isSignup ? "Already have an account?" : "New to our coffee club?"}
          </span>
          <motion.button
            onClick={handleSwitchMode}
            className="switch-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSignup ? "Login" : "Sign Up"}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default AuthPage;
