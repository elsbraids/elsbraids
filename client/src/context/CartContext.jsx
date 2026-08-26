import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'els-braids-cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    if (Number(product.stock) <= 0) return;
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock || 999) } : item,
        );
      }
      return [...current, { ...product, quantity: Math.min(quantity, Number(product.stock) || 999) }];
    });
  };

  const removeFromCart = (id) => setCart((current) => current.filter((item) => item.id !== id));

  const updateQuantity = (id, delta) =>
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: Math.min(Number(item.stock) || 999, Math.max(1, item.quantity + delta)) } : item))
        .filter((item) => item.quantity > 0),
    );

  const clearCart = () => setCart([]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    [cart],
  );

  const value = { cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
