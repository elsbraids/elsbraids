import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function CustomerSigninPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/customers/signin', form);
      if (response.data.success) {
        alert('Signed in successfully.');
        navigate('/');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to sign in. Please try again.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 overflow-hidden rounded-[2rem] border border-[#ead4dd] bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-gradient-to-br from-[#5b2b45] via-[#7a3855] to-[#c98fa7] p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f7dfe8]">Welcome back</p>
          <h1 className="mt-4 text-4xl font-black uppercase">Customer sign in</h1>
          <p className="mt-4 text-sm leading-6 text-[#f4e6ec]">
            Sign in to manage bookings, review orders, and continue your checkout journey with EL&apos;S BRAIDS.
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-black uppercase text-[#5b2b45]">Sign In</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-medium text-[#5b2b45]">
              Email address
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />
            </label>

            <label className="block text-sm font-medium text-[#5b2b45]">
              <span className="flex items-center justify-between">
                <span>Password</span>
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-xs font-semibold uppercase tracking-wide text-[#5b2b45] underline">
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

            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[#5b2b45] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-[#5f4253]">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-[#5b2b45] underline">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CustomerSigninPage;
