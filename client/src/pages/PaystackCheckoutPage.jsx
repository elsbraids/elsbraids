import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const checkoutDraftKey = 'elsCheckoutDraft';

function PaystackCheckoutPage() {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();
  const [form, setForm] = useState(() => {
    try {
      const draft = sessionStorage.getItem(checkoutDraftKey);
      if (draft) {
        sessionStorage.removeItem(checkoutDraftKey);
        return JSON.parse(draft);
      }
    } catch { }
    return { customerName: '', email: '', phone: '', address: '', region: '', city: '', deliveryLocation: 'Home delivery', notes: '' };
  });
  const [submitting, setSubmitting] = useState(false);
  const [isPaystackReady, setIsPaystackReady] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setIsPaystackReady(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

    if (!window.PaystackPop) {
      alert('Paystack is still loading. Please wait a moment and try again.');
      return;
    }

    const payload = {
      key: paystackKey,
      email: form.email,
      amount: Math.round(Number(subtotal) * 100),
      currency: 'GHS',
      ref: `els-${Date.now()}`,
      metadata: {
        custom_fields: [{ display_name: 'Customer', variable_name: 'customer', value: form.customerName }],
      },
      callback: async (response) => {
        try {
          await axios.post('/api/orders', {
            ...form,
            items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
            paymentReference: response.reference,
          }, { withCredentials: true });
          clearCart();
          alert('Payment successful and order placed.');
          navigate('/shop');
        } catch (error) {
          console.error(error);
          alert('Payment succeeded but order save failed. Please contact support.');
        }
      },
      onClose: () => {
        alert('Payment window closed. Your order was not completed.');
      },
    };

    const handler = window.PaystackPop.setup(payload);
    handler.openIframe();
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
            <input required name="region" value={form.region} onChange={handleChange} placeholder="Region" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
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

          <button type="submit" disabled={submitting || !isPaystackReady} className="mt-8 w-full rounded-md bg-[#5b2b45] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'PROCESSING...' : !isPaystackReady ? 'LOADING PAYSTACK...' : 'PAY WITH PAYSTACK'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaystackCheckoutPage;
