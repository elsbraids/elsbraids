import { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, CalendarDays, ExternalLink, FileText, Image, LayoutDashboard, LogOut, Mail, Menu, MessageSquare, Package, Settings, ShoppingBag, Star, Users, X } from 'lucide-react';

function AdminLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem('elsAdminToken');
        await axios.get('/api/auth/me', {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      sessionStorage.removeItem('elsAdminToken');
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7edf1] text-[#5b2b45]">
        <div className="text-lg font-semibold">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navigation = [
    { label: 'Overview', view: 'overview', icon: LayoutDashboard },
    { label: 'Products / Styles', view: 'catalog', icon: Package },
    { label: 'Bookings', view: 'bookings', icon: CalendarDays },
    { label: 'Orders', view: 'orders', icon: ShoppingBag },
    { label: 'Customers', view: 'customers', icon: Users },
    { label: 'Gallery', view: 'gallery', icon: Image },
    { label: 'Reviews', view: 'reviews', icon: Star },
    { label: 'Messages', view: 'messages', icon: MessageSquare },
    { label: 'Website Content', view: 'settings', icon: FileText },
    { label: 'Notifications', view: 'notifications', icon: Bell },
  ];

  const navClass = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white';

  return (
    <div className="min-h-screen bg-[#f7edf1] text-[#2b1d22]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto bg-[#351b29] px-5 py-6 text-white shadow-xl transition-transform lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-start justify-between">
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
              <div className="text-xs uppercase tracking-[0.24em] text-[#f7dbe8]">Studio admin</div>
              <div className="mt-2 text-2xl font-black uppercase">EL'S BRAIDS</div>
            </Link>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close admin menu" className="rounded-full p-2 text-white/70 hover:bg-white/10 lg:hidden"><X size={20} /></button>
          </div>

          <div className="mt-12">
            <div className="mb-3 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Workspace</div>
            <nav className="space-y-1">
              {navigation.map(({ label, view, icon: Icon }) => (
                <NavLink key={`${view}-${label}`} to={view === 'overview' ? '/admin' : `/admin?view=${view}`} end={view === 'overview'} className={navClass} onClick={() => setMobileMenuOpen(false)}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-1 pt-10">
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"><ExternalLink size={18} /> View storefront</a>
            <div className="my-3 border-t border-white/10" />
            <button type="button" onClick={() => navigate('/admin?view=settings')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"><Settings size={18} /> Settings</button>
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#f7dbe8] transition hover:bg-white/10"><LogOut size={18} /> Log out</button>
          </div>
        </aside>

        {mobileMenuOpen && <button type="button" aria-label="Close admin menu overlay" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}

        <main className="min-w-0 flex-1">
          <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-[#ead4dd] bg-[#fffafc]/90 px-4 py-4 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open admin menu" className="rounded-full p-2 text-[#5b2b45] hover:bg-[#f9eaf1] lg:hidden"><Menu size={22} /></button>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a3855]">Control center</div>
                <div className="font-semibold text-[#5b2b45]">Manage your studio with clarity</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="hidden items-center gap-2 rounded-full border border-[#ead4dd] bg-white px-3 py-2 text-sm text-[#7a3855] md:flex"><span className="text-xs uppercase tracking-[0.12em]">Search</span><input aria-label="Search dashboard" placeholder="Bookings, products..." className="w-36 bg-transparent text-[#5b2b45] outline-none placeholder:text-[#b48b9c]" /></label>
              <button type="button" aria-label="View notifications" className="relative rounded-full p-2 text-[#5b2b45] transition hover:bg-[#f9eaf1]"><Bell size={19} /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#b36a86]" /></button>
              <div className="hidden text-right sm:block"><div className="text-sm font-bold text-[#5b2b45]">Admin</div><div className="text-xs text-[#7a3855]">Administrator</div></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5b2b45] text-sm font-bold text-white">A</div>
            </div>
          </header>
          <div className="px-4 py-8 sm:px-8 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
