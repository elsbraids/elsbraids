import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailsPage from './pages/ServiceDetailsPage';
import BookingPage from './pages/BookingPage';
import GalleryPage from './pages/GalleryPage';
import ShopPage from './pages/ShopPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import PaystackCheckoutPage from './pages/PaystackCheckoutPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { CartProvider } from './context/CartContext';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:id" element={<ServiceDetailsPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/products/:id" element={<ProductDetailsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<PaystackCheckoutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
          <Route path="/signup" element={<CustomerAuthPage />} />
          <Route path="/signin" element={<CustomerAuthPage />} />
          <Route path="/forgot-password" element={<CustomerAuthPage />} />
          <Route path="/reset-password" element={<CustomerAuthPage />} />
          <Route path="/account/orders" element={<CustomerOrdersPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
