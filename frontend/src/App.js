import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ChatbotPage from "./pages/ChatbotPage";
import Dashboard from "./pages/Dashboard";
import ViewCartPage from "./pages/ViewCartPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import AdminDashboard from "./pages/AdminDashboard";
import ProductListing from './pages/ProductListing';
import Payment from './pages/PaymentPage'

import '@fortawesome/fontawesome-free/css/all.min.css';
import 'swiper/css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth">
          <Route path="login" element={<AuthPage initialMode="login" />} />
          <Route path="signup" element={<AuthPage initialMode="signup" />} />
          <Route index element={<AuthPage initialMode="login" />} />
        </Route>
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/cart" element={<ViewCartPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/products" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/products" element={<ProductListing />} />
        <Route path="/payment" element={<Payment />} />
      </Routes>
    </Router>
  );
}

export default App;