import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black uppercase text-[#5b2b45]">Your Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          {cart.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-8 text-center text-[#5f4253]">Your cart is empty.</div>
          ) : cart.map((item) => (
            <div key={item.id} className="relative grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-4 shadow-soft sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center">
              <img src={item.images?.[0]} alt={item.name} className="h-[88px] w-[88px] rounded-xl object-cover sm:h-28 sm:w-28" />
              <div className="min-w-0 pr-8 sm:pr-0">
                <h3 className="truncate text-lg font-semibold text-[#5b2b45] sm:text-xl">{item.name}</h3>
                <p className="mt-1 text-sm text-[#5f4253]">GHC {item.price}</p>
                <div className="mt-3 flex w-fit items-center gap-2">
                  <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`} className="rounded-md border border-[#d9bcc7] p-2"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`} className="rounded-md border border-[#d9bcc7] p-2"><Plus size={14} /></button>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between border-t border-[#ead4dd] pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
                <span className="text-sm font-semibold text-[#5b2b45]">GHC {item.price * item.quantity}</span>
                <button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`} className="rounded-md bg-[#5b2b45] p-2 text-white"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-[#5b2b45]">Summary</h2>
          <div className="mt-5 space-y-3 text-[#5f4253]">
            <div className="flex justify-between"><span>Subtotal</span><span>GHC {subtotal}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>GHC 0</span></div>
            <div className="flex justify-between text-lg font-bold text-[#5b2b45]"><span>Total</span><span>GHC {subtotal}</span></div>
          </div>
          <Link to="/checkout" aria-disabled={cart.length === 0} className={`mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-semibold text-white ${cart.length === 0 ? 'pointer-events-none bg-[#c9aeba]' : 'bg-[#5b2b45]'}`}>Proceed to checkout</Link>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
