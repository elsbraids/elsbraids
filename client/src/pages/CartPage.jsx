import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { handleImageError, optimizeImageUrl } from '../utils/image';

function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/settings').then((res) => setSettings(res.data.data || {})).catch(console.error).finally(() => setSettingsLoading(false));
  }, []);

  const heroImage = settings.heroImages?.find(Boolean) || '/hero_braids.jpg';

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        {settingsLoading ? <div className="absolute inset-0 animate-pulse bg-[#eadde2]" aria-label="Loading cart image" /> : <img
          src={optimizeImageUrl(heroImage, 1600)}
          alt="Your shopping cart at EL'S BRAIDS"
          onError={(event) => handleImageError(event)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">Shopping</p>
            <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">Your Cart</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-12 text-center text-[#5f4253]">
                <ShoppingBag className="h-12 w-12 text-[#ead4dd]" />
                <p className="font-semibold">Your cart is empty.</p>
                <Link to="/shop" className="rounded-full bg-[#5b2b45] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#712f4b] transition-colors">
                  Browse the Shop
                </Link>
              </div>
            ) : cart.map((item) => (
              <div key={item.id} className="relative grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-4 shadow-soft sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center">
                <img src={optimizeImageUrl(item.images?.[0] || '/hero_braids.jpg')} alt={item.name} onError={(event) => handleImageError(event)} loading="lazy" className="h-[88px] w-[88px] rounded-xl object-cover sm:h-28 sm:w-28" />
                <div className="min-w-0 pr-8 sm:pr-0">
                  <h3 className="truncate text-lg font-semibold text-[#5b2b45] sm:text-xl">{item.name}</h3>
                  <p className="mt-1 text-sm text-[#5f4253]">GHC {item.price}</p>
                  <div className="mt-3 flex w-fit items-center gap-2">
                    <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`} className="rounded-md border border-[#d9bcc7] p-2 hover:bg-[#f9eaf1] transition-colors"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`} className="rounded-md border border-[#d9bcc7] p-2 hover:bg-[#f9eaf1] transition-colors"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-between border-t border-[#ead4dd] pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
                  <span className="text-sm font-semibold text-[#5b2b45]">GHC {item.price * item.quantity}</span>
                  <button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`} className="rounded-md bg-[#5b2b45] p-2 text-white hover:bg-[#712f4b] transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft lg:self-start lg:sticky lg:top-6">
            <h2 className="text-2xl font-bold text-[#5b2b45]">Summary</h2>
            <div className="mt-5 space-y-3 text-[#5f4253]">
              <div className="flex justify-between"><span>Subtotal</span><span>GHC {subtotal}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>GHC 0</span></div>
              <div className="flex justify-between border-t border-[#ead4dd] pt-3 text-lg font-bold text-[#5b2b45]"><span>Total</span><span>GHC {subtotal}</span></div>
            </div>
            <Link to="/checkout" aria-disabled={cart.length === 0} className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white transition-colors ${cart.length === 0 ? 'pointer-events-none bg-[#c9aeba]' : 'bg-[#5b2b45] hover:bg-[#712f4b]'}`}>
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
