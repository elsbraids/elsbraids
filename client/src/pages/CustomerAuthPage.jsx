import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  city: '',
  address: '',
};

function CustomerAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isSignIn = location.pathname === '/signin';
  const isForgotPassword = location.pathname === '/forgot-password';
  const isResetPassword = location.pathname === '/reset-password';
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleError] = useState(new URLSearchParams(location.search).get('google') === 'failed');
  const [resetToken, setResetToken] = useState(searchParams.get('token') || '');
  const [resetMessage, setResetMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isForgotPassword) {
        const response = await axios.post('/api/customers/forgot-password', { email: form.email });
        setResetMessage(response.data.resetToken ? `Development reset token: ${response.data.resetToken}` : response.data.message);
        return;
      }
      if (isResetPassword) {
        const response = await axios.post('/api/customers/reset-password', { token: resetToken, password: form.password });
        alert(response.data.message);
        navigate('/signin');
        return;
      }
      const endpoint = isSignIn ? '/api/customers/signin' : '/api/customers/signup';
      const payload = isSignIn ? { email: form.email, password: form.password } : form;
      const response = await axios.post(endpoint, payload, { withCredentials: true });

      if (response.data.success) {
        if (isSignIn) {
          alert('Signed in successfully.');
          navigate(location.state?.from || '/');
          return;
        }

        alert('Account created successfully. You can now sign in and checkout securely.');
        navigate('/signin', { state: { from: location.state?.from } });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to complete this request. Please try again.';
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
          <h1 className="mt-4 text-4xl font-black uppercase">{isSignIn ? 'Welcome back' : 'Create your profile'}</h1>
          <p className="mt-4 text-sm leading-6 text-[#f4e6ec]">
            {isSignIn
              ? 'Sign in to manage bookings, review orders, and continue your checkout journey with EL\'S BRAIDS.'
              : 'Sign up to book appointments, save your details, and pay securely with Paystack for your orders.'}
          </p>
          <div className="mt-8 space-y-4 text-sm text-[#f8ebf0]">
            <div className="rounded-xl border border-white/20 bg-white/5 p-4">Fast bookings with saved customer details</div>
            <div className="rounded-xl border border-white/20 bg-white/5 p-4">Secure checkout via Paystack integration</div>
            <div className="rounded-xl border border-white/20 bg-white/5 p-4">Convenient order tracking and updates</div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          {!isForgotPassword && !isResetPassword && <div className="mb-6 grid grid-cols-2 rounded-full border border-[#ead4dd] bg-[#fffafc] p-1">
            <Link
              to="/signin"
              state={{ from: location.state?.from }}
              className={`rounded-full px-4 py-2 text-center text-sm font-semibold transition ${isSignIn ? 'bg-[#5b2b45] text-white' : 'text-[#5b2b45]'}`}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              state={{ from: location.state?.from }}
              className={`rounded-full px-4 py-2 text-center text-sm font-semibold transition ${!isSignIn ? 'bg-[#5b2b45] text-white' : 'text-[#5b2b45]'}`}
            >
              Sign Up
            </Link>
          </div>}

          <h2 className="text-2xl font-black uppercase text-[#5b2b45]">{isForgotPassword ? 'Forgot Password' : isResetPassword ? 'Reset Password' : isSignIn ? 'Sign In' : 'Sign Up'}</h2>
          {isSignIn && <a href="/api/customers/google" className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-[#e7d2dc] bg-white px-4 py-3 text-sm font-semibold text-[#5b2b45]"><FcGoogle size={20} /> Continue with Google</a>}
          {googleError && <p className="mt-3 text-sm text-red-700">Google sign-in could not be completed. Please try again.</p>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {(isForgotPassword || isResetPassword) && <label className="block text-sm font-medium text-[#5b2b45]">
              {isResetPassword ? 'Reset token' : 'Email address'}
              {isResetPassword ? <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" /> : <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />}
            </label>}
            {isResetPassword && <label className="block text-sm font-medium text-[#5b2b45]">New password<input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" /></label>}
            {isForgotPassword && resetMessage && <p className="rounded-lg bg-[#edf8f1] px-4 py-3 text-sm font-semibold text-green-800">{resetMessage}</p>}
            {!isSignIn && (
              !isForgotPassword && !isResetPassword &&
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
                  <div className="mb-2">
                    <span>Password</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 pr-11 outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-3 flex items-center justify-center text-[#5b2b45]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
            )}

            {isSignIn && !isForgotPassword && !isResetPassword && (
              <>
                <label className="block text-sm font-medium text-[#5b2b45]">
                  Email address
                  <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />
                </label>

                <label className="block text-sm font-medium text-[#5b2b45]">
                  <div className="mb-2">
                    <span>Password</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 pr-11 outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-3 flex items-center justify-center text-[#5b2b45]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[#5b2b45] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Please wait...' : isForgotPassword ? 'Send reset instructions' : isResetPassword ? 'Reset password' : isSignIn ? 'Sign In' : 'Create account'}
            </button>

            {!isForgotPassword && !isResetPassword && isSignIn && <p className="text-center text-sm text-[#5f4253]">
              <Link to="/forgot-password" className="font-semibold text-[#5b2b45] underline">Forgot password?</Link>
            </p>}
            {(isForgotPassword || isResetPassword) && <p className="text-center text-sm text-[#5f4253]"><Link to="/signin" className="font-semibold text-[#5b2b45] underline">Back to sign in</Link></p>}
            {!isForgotPassword && !isResetPassword && <p className="text-center text-sm text-[#5f4253]">
              {isSignIn ? 'Need an account?' : 'Already have an account?'}{' '}
              <Link to={isSignIn ? '/signup' : '/signin'} state={{ from: location.state?.from }} className="font-semibold text-[#5b2b45] underline">
                {isSignIn ? 'Create one' : 'Sign in'}
              </Link>
            </p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default CustomerAuthPage;
