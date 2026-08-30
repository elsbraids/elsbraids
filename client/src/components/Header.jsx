import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingBag, Search, User, CalendarCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { handleImageError, optimizeImageUrl } from '../utils/image';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Shop', to: '/shop' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

function Header() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const { cart } = useCart();
  const cartCount = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

  useEffect(() => {
    axios.get('/api/settings').then((response) => {
      const nextSettings = response.data.data || {};
      setSettings(nextSettings);
      if (nextSettings.favicon) {
        const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = nextSettings.favicon;
        document.head.appendChild(favicon);
      }
    }).catch(console.error).finally(() => setSettingsLoading(false));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9d6df] bg-[#f7e7ee]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          {settingsLoading ? <div className="h-10 w-10 animate-pulse rounded-full bg-[#eadde2]" aria-label="Loading logo" /> : settings.logo ? <img src={optimizeImageUrl(settings.logo, 160)} alt="EL'S BRAIDS logo" onError={(event) => handleImageError(event)} loading="lazy" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7a3855] bg-[#f3dbe7] text-[#5b2b45]"><span className="text-lg font-semibold">E</span></div>}
          <div>
            <div className="font-['Twinkle_Star',cursive] text-3xl font-bold uppercase leading-none text-[#5b2b45]">EL'S</div>
            <div className="font-['Twinkle_Star',cursive] text-sm font-bold uppercase tracking-[0.12em] text-[#7a3855]">Braids</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative text-sm font-medium transition after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:bg-[#5b2b45] after:transition-all ${isActive ? 'text-[#5b2b45] after:w-full' : 'text-[#5f4253] after:w-0 hover:text-[#5b2b45] hover:after:w-full'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/account/orders" aria-label="Account and orders" title="Account and orders" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7a3855] text-[#5b2b45] transition hover:bg-[#f3dfe8]">
            <User size={18} />
          </Link>
          <Link to="/book" aria-label="Book appointment" title="Book appointment" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7a3855] text-[#5b2b45] transition hover:bg-[#f3dfe8]">
            <CalendarCheck size={18} />
          </Link>
          <Link to="/cart" aria-label={`Cart${cartCount ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#5b2b45] text-white shadow-soft">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c98fa7] px-1 text-[10px] font-bold text-white">{cartCount}</span>}
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Open menu">
          <Menu size={24} className="text-[#5b2b45]" />
        </button>
      </div>

      {open && (
        <div className="border-t border-[#e9d6df] bg-[#fff8fb] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `relative rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-[#f3dfe8] text-[#5b2b45] after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:bg-[#5b2b45]' : 'text-[#5b2b45]'}`}
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/account/orders" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-full border border-[#7a3855] px-3 py-2.5 text-center text-sm font-semibold text-[#5b2b45]">
              <User size={16} /> <span>Account</span>
            </Link>
            <Link to="/book" onClick={() => setOpen(false)} aria-label="Book appointment" title="Book appointment" className="mt-2 flex h-11 items-center justify-center gap-2 rounded-full bg-[#5b2b45] px-4 text-sm font-semibold text-white">
              <CalendarCheck size={18} />
              <span>Book Appointment</span>
            </Link>
            <Link to="/cart" className="mt-2 flex items-center gap-2 rounded-md bg-[#5b2b45] px-3 py-2 text-sm font-semibold text-white">
              <ShoppingBag size={16} /> Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
