import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post('/api/customers/logout', {}, { withCredentials: true });
    navigate('/signin');
  };

  useEffect(() => {
    axios.get('/api/customers/me/orders', { withCredentials: true })
      .then((response) => setOrders(response.data.data || []))
      .catch(() => setError('Please sign in to view your orders.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#7a3855]">Your account</p>
          <h1 className="mt-2 text-4xl font-black uppercase text-[#5b2b45]">My Orders</h1>
        </div>
        <div className="flex items-center gap-3"><button type="button" onClick={handleLogout} className="rounded-full border border-[#7a3855] px-5 py-3 text-sm font-semibold text-[#5b2b45]">Log out</button><Link to="/shop" className="rounded-full bg-[#5b2b45] px-5 py-3 text-sm font-semibold text-white">Continue shopping</Link></div>
      </div>

      {loading && <p className="mt-10 text-[#5f4253]">Loading your orders...</p>}
      {!loading && error && <div className="mt-10 rounded-2xl border border-[#ead4dd] bg-white p-8 text-center text-[#5f4253]"><p>{error}</p><Link to="/signin" className="mt-4 inline-block font-semibold text-[#5b2b45] underline">Sign in</Link></div>}
      {!loading && !error && orders.length === 0 && <div className="mt-10 rounded-2xl border border-[#ead4dd] bg-white p-8 text-center text-[#5f4253]">You have no orders yet.</div>}
      {!loading && !error && orders.length > 0 && (
        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <article key={order.id || order._id} className="rounded-2xl border border-[#ead4dd] bg-white p-6 shadow-soft">
              <div className="flex flex-wrap justify-between gap-3 border-b border-[#f0dfe5] pb-4">
                <div><h2 className="font-bold text-[#5b2b45]">Order {order.id || order._id}</h2><p className="mt-1 text-xs text-[#7a3855]">{new Date(order.createdAt).toLocaleDateString()}</p></div>
                <span className="rounded-full bg-[#f3dfe8] px-3 py-1 text-xs font-bold uppercase text-[#5b2b45]">{order.paymentStatus || 'Pending'}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-[#5f4253]">
                {(order.items || []).map((item, index) => <div key={`${item.productId || item.name}-${index}`} className="flex justify-between gap-4"><span>{item.name} x {item.quantity}</span><span>GHC {item.price * item.quantity}</span></div>)}
              </div>
              <div className="mt-5 flex justify-between border-t border-[#f0dfe5] pt-4 font-bold text-[#5b2b45]"><span>Total</span><span>{order.currency || 'GHS'} {order.total}</span></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerOrdersPage;
