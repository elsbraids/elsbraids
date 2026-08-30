import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const checkoutDraftKey = 'elsCheckoutDraft';
const ghanaRegions = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
];

function PaystackCheckoutPage() {
  const navigate = useNavigate();
  const reference = new URLSearchParams(window.location.search).get('reference');
  const isPaymentReturn = Boolean(reference);
  const { cart, subtotal, clearCart } = useCart();
  const [form, setForm] = useState(() => {
    try {
      const draft = sessionStorage.getItem(checkoutDraftKey);
      if (draft) {
        if (!isPaymentReturn) sessionStorage.removeItem(checkoutDraftKey);
        return JSON.parse(draft);
      }
    } catch { }
    return { customerName: '', email: '', phone: '', address: '', region: '', city: '', deliveryLocation: 'Home delivery', notes: '' };
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!reference) return;
    const finalizeRedirectedPayment = async () => {
      try {
        const verification = await axios.get(`/api/payments/verify/${encodeURIComponent(reference)}`, { withCredentials: true });
        if (verification.data.data?.status !== 'success') throw new Error('Payment verification failed');
        await axios.post('/api/orders', { ...form, items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })), paymentReference: reference }, { withCredentials: true });
        clearCart();
        alert('Payment successful and order placed.');
        navigate('/shop', { replace: true });
      } catch (error) {
        console.error('[payment] Redirect verification failed:', error);
        alert(error.response?.data?.message || 'Unable to verify your payment. Please contact support.');
      }
    };
    finalizeRedirectedPayment();
  }, [reference]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePaystackPayment = async () => {
    if (!cart.length) {
      alert('Add items to your cart before checkout.');
      navigate('/shop');
      return;
    }

    const paymentReference = `els-${Date.now()}`;
    sessionStorage.setItem(checkoutDraftKey, JSON.stringify(form));
    console.log('[payment] Requesting Paystack authorization URL:', { amount: subtotal, email: form.email, reference: paymentReference });
    const response = await axios.post('/api/payment', { amount: Math.round(Number(subtotal) * 100), email: form.email, reference: paymentReference }, { withCredentials: true });
    console.log('[payment] Authorization URL received:', response.data.data?.authorization_url);
    window.location.assign(response.data.data.authorization_url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await axios.get('/api/customers/me', { withCredentials: true });
      await handlePaystackPayment();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        sessionStorage.setItem(checkoutDraftKey, JSON.stringify(form));
        alert('Please sign in before completing checkout.');
        navigate('/signin', { state: { from: '/checkout' } });
        return;
      }
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black uppercase text-[#5b2b45]">Checkout</h1>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5 rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2">
            <input required name="customerName" value={form.customerName} onChange={handleChange} placeholder="Full name" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
            <input required name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
            <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3 md:col-span-2" />
            <input required name="address" value={form.address} onChange={handleChange} placeholder="Delivery address" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3 md:col-span-2" />
            <select required name="deliveryLocation" value={form.deliveryLocation} onChange={handleChange} className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3">
              <option value="Salon pickup">Salon pickup</option>
              <option value="Home delivery">Home delivery</option>
            </select>
            <select required name="region" value={form.region} onChange={handleChange} className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3">
              <option value="">Select region</option>
              {ghanaRegions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
            <input required name="city" value={form.city} onChange={handleChange} placeholder="City" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes" className="min-h-[120px] rounded-lg border border-[#ead4dd] bg-white px-4 py-3 md:col-span-2" />
          </div>
        </div>

        <div className="self-start rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-[#5b2b45]">Order Summary</h2>
          <div className="mt-5 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-[#5f4253]">
                <span>{item.name} x {item.quantity}</span>
                <span>GHC {item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[#ead4dd] pt-4 text-lg font-bold text-[#5b2b45] flex justify-between">
            <span>Total</span>
            <span>GHC {subtotal}</span>
          </div>

          <button type="submit" disabled={submitting} className="mt-8 w-full rounded-md bg-[#5b2b45] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'PROCESSING...' : 'CONTINUE TO PAYSTACK'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaystackCheckoutPage;
