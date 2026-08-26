import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', form, { withCredentials: true });
      if (response.data.success) {
        sessionStorage.setItem('elsAdminToken', response.data.token);
        navigate('/admin');
      }
    } catch (error) {
      console.error(error);
      alert('Invalid admin credentials');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9eef2] px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-[#ead4dd] bg-white p-8 shadow-soft">
        <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-[#7a3855]">Admin Access</p>
        <h1 className="mt-3 text-center text-3xl font-black uppercase text-[#5b2b45]">Login</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 outline-none" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-[#5b2b45]">Password</label>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-[#e7d2dc] bg-[#fffafc] px-4 py-3 pr-11 outline-none" />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-3 flex items-center justify-center text-[#5b2b45]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full rounded-lg bg-[#5b2b45] px-4 py-3 font-semibold text-white">Sign In</button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;
