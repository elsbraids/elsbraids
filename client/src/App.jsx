import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
import MainLayout from './layouts/MainLayout';
import { CartProvider } from './context/CartContext';
import './App.css';

const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetailsPage = lazy(() => import('./pages/ServiceDetailsPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const PaystackCheckoutPage = lazy(() => import('./pages/PaystackCheckoutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CustomerAuthPage = lazy(() => import('./pages/CustomerAuthPage'));
const CustomerOrdersPage = lazy(() => import('./pages/CustomerOrdersPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f9efef]">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-[#5b2b45]"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Suspense fallback={<LoadingFallback />}>
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
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
          </Routes>
        </Suspense>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
