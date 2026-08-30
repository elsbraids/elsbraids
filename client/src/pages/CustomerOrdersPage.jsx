import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package } from 'lucide-react';

function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({});
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post('/api/customers/logout', {}, { withCredentials: true });
    navigate('/signin');
  };

  useEffect(() => {
    axios.get('/api/settings').then((res) => setSettings(res.data.data || {})).catch(console.error);
    axios.get('/api/customers/me/orders', { withCredentials: true })
      .then((response) => setOrders(response.data.data || []))
      .catch(() => setError('Please sign in to view your orders.'))
      .finally(() => setLoading(false));
  }, []);

  const heroImage = settings.heroImages?.find(Boolean) || '/hero_braids.jpg';

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        <img
          src={heroImage}
          alt="Your EL'S BRAIDS account"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/hero_braids.jpg'; }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex w-full flex-wrap items-end justify-between gap-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">Your Account</p>
              <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">My Orders</h1>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <button type="button" onClick={handleLogout} className="rounded-full border border-white/60 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
                Log out
              </button>
              <Link to="/shop" className="rounded-full bg-[#5b2b45] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#712f4b]">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {loading && <p className="mt-4 text-[#5f4253]">Loading your orders...</p>}

        {!loading && error && (
          <div className="mt-4 rounded-2xl border border-[#ead4dd] bg-white p-8 text-center text-[#5f4253]">
            <User className="mx-auto mb-3 h-10 w-10 text-[#ead4dd]" />
            <p>{error}</p>
            <Link to="/signin" className="mt-4 inline-block font-semibold text-[#5b2b45] underline">Sign in</Link>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-4 flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#ead4dd] bg-white p-12 text-center text-[#5f4253]">
            <Package className="h-12 w-12 text-[#ead4dd]" />
            <p className="font-semibold">You have no orders yet.</p>
            <Link to="/shop" className="rounded-full bg-[#5b2b45] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#712f4b] transition-colors">
              Browse the Shop
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="mt-4 space-y-5">
            {orders.map((order) => (
              <article key={order.id || order._id} className="rounded-2xl border border-[#ead4dd] bg-white p-6 shadow-soft">
                <div className="flex flex-wrap justify-between gap-3 border-b border-[#f0dfe5] pb-4">
                  <div>
                    <h2 className="font-bold text-[#5b2b45]">Order {order.id || order._id}</h2>
                    <p className="mt-1 text-xs text-[#7a3855]">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full bg-[#f3dfe8] px-3 py-1 text-xs font-bold uppercase text-[#5b2b45]">{order.paymentStatus || 'Pending'}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-[#5f4253]">
                  {(order.items || []).map((item, index) => (
                    <div key={`${item.productId || item.name}-${index}`} className="flex justify-between gap-4">
                      <span>{item.name} x {item.quantity}</span>
                      <span>GHC {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-between border-t border-[#f0dfe5] pt-4 font-bold text-[#5b2b45]">
                  <span>Total</span>
                  <span>{order.currency || 'GHS'} {order.total}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerOrdersPage;
