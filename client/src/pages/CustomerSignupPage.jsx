import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  city: '',
  address: '',
};

function CustomerSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/customers/signup', form);
      if (response.data.success) {
        alert('Account created successfully. You can now sign in and checkout securely.');
        navigate('/');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to create your account. Please try again.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 overflow-hidden rounded-[2rem] border border-[#ead4dd] bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-gradient-to-br from-[#5b2b45] via-[#7a3855] to-[#c98fa7] p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f7dfe8]">Customer account</p>
          <h1 className="mt-4 text-4xl font-black uppercase">Create your profile</h1>
          <p className="mt-4 text-sm leading-6 text-[#f4e6ec]">
            Sign up to book appointments, save your details, and pay securely with Paystack for your orders.
          </p>
          <div className="mt-8 space-y-4 text-sm text-[#f8ebf0]">
            <div className="rounded-xl border border-white/20 bg-white/5 p-4">Fast bookings with saved customer details</div>
            <div className="rounded-xl border border-white/20 bg-white/5 p-4">Secure checkout via Paystack integration</div>
            <div className="rounded-xl border border-white/20 bg-white/5 p-4">Convenient order tracking and updates</div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-black uppercase text-[#5b2b45]">Sign Up</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium text-[#5b2b45] md:col-span-2">
                Full name
                <input name="fullName" value={form.fullName} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />
              </label>

              <label className="block text-sm font-medium text-[#5b2b45] md:col-span-2">
                Email address
                <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />
              </label>

              <label className="block text-sm font-medium text-[#5b2b45] md:col-span-2">
                Phone number
                <input name="phone" value={form.phone} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />
              </label>

              <label className="block text-sm font-medium text-[#5b2b45] md:col-span-2">
                <span className="flex items-center justify-between">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-xs font-semibold uppercase tracking-wide text-[#5b2b45] underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none"
                />
              </label>

              <label className="block text-sm font-medium text-[#5b2b45]">
                City
                <input name="city" value={form.city} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />
              </label>

              <label className="block text-sm font-medium text-[#5b2b45]">
                Address
                <input name="address" value={form.address} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[#5b2b45] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-center text-sm text-[#5f4253]">
              Already have an account?{' '}
              <Link to="/" className="font-semibold text-[#5b2b45] underline">Return home</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CustomerSignupPage;
