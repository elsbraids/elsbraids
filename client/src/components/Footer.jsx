import { Link } from 'react-router-dom';
import { Camera, MessageCircle, MapPin, Phone, BadgeCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

function SocialLogo({ type }) {
  if (type === 'instagram') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" /></svg>;
  }
  if (type === 'facebook') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M13.5 21v-8h2.75l.42-3h-3.17V8.06c0-.87.24-1.46 1.5-1.46h1.8V3.92c-.31-.04-1.37-.14-2.6-.14-2.57 0-4.33 1.57-4.33 4.45V10H7.1v3h2.77v8h3.63Z" /></svg>;
  }
  if (type === 'tiktok') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M15.7 3c.3 2.3 1.6 3.7 3.8 3.9v3.1a8.2 8.2 0 0 1-3.8-1.1v6.4a5.7 5.7 0 1 1-4.9-5.6v3.2a2.6 2.6 0 1 0 1.8 2.4V3h3.1Z" /></svg>;
  }
  if (type === 'snapchat') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M12 2.5c-3.2 0-5.4 2.3-5.4 5.6v2.2c-.8.6-1.5.9-2.3 1.1-.5.1-.8.5-.7 1 .1.6.8 1 1.7 1.2.3.1.4.3.3.6-.2.7-.7 1.1-1.3 1.4-.4.2-.6.5-.5.9.1.5.7.7 1.6.8.5.1.9.3 1 .7.2.6.4.8 1.1.7.9-.1 1.7.2 2.5.8.6.5 1.3.8 2 .8s1.4-.3 2-.8c.8-.6 1.6-.9 2.5-.8.7.1.9-.1 1.1-.7.1-.4.5-.6 1-.7.9-.1 1.5-.3 1.6-.8.1-.4-.1-.7-.5-.9-.6-.3-1.1-.7-1.3-1.4-.1-.3 0-.5.3-.6.9-.2 1.6-.6 1.7-1.2.1-.5-.2-.9-.7-1-.8-.2-1.5-.5-2.3-1.1V8.1c0-3.3-2.2-5.6-5.4-5.6Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M19.05 4.93A9.87 9.87 0 0 0 12 2a9.94 9.94 0 0 0-8.62 14.87L2 22l5.27-1.38A9.94 9.94 0 0 0 22 12a9.87 9.87 0 0 0-2.95-7.07ZM12 20.3a8.27 8.27 0 0 1-4.22-1.16l-.3-.18-3.13.82.84-3.05-.2-.31A8.3 8.3 0 1 1 12 20.3Zm4.55-6.23c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.57.13-.17.25-.65.81-.8.98-.15.17-.3.19-.55.06-.25-.13-1.05-.39-2-1.25-.74-.66-1.25-1.47-1.39-1.72-.15-.25-.02-.39.11-.52.12-.12.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.87-.21-.49-.42-.42-.57-.43h-.49c-.17 0-.45.06-.68.32-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.71 4.29 3.8.6.26 1.07.41 1.43.52.6.19 1.14.16 1.57.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.11-.23-.17-.48-.3Z" /></svg>;
}

function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    axios.get('/api/settings').then((response) => setSettings(response.data.data || {})).catch(console.error);
  }, []);

  const location = String(settings.location || 'Atonsu, Kumasi, Ghana').replace(/Atomsu/gi, 'Atonsu');
  const socials = settings.socials || {};
  return (
    <footer className="mt-16 bg-[#f7e7ee] border-t border-[#ead3df]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-4 font-['Twinkle_Star',cursive] text-3xl font-bold uppercase text-[#5b2b45]">EL'S BRAIDS</div>
          <p className="text-sm leading-7 text-[#5f4253]">
            Professional braiding, piercing and beauty services in Kumasi.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#5b2b45]">Explore</h4>
          <div className="flex flex-col gap-3 text-sm text-[#5f4253]">
            <Link to="/services">Services</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/about">About</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#5b2b45]">Contact</h4>
          <div className="space-y-3 text-sm text-[#5f4253]">
            <a href={settings.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2"><MapPin size={16} /> {location}</a>
            <div className="flex items-center gap-2"><Phone size={16} /> {settings.phone || '0553971315'}</div>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#5b2b45]">Follow Us</h4>
          <div className="flex gap-3 text-[#5b2b45]">
            {['instagram', 'facebook', 'whatsapp', 'tiktok', 'snapchat'].map((type) => socials[type] && socials[type] !== '#' && (
              <a key={type} href={socials[type]} target="_blank" rel="noreferrer" aria-label={type} className="rounded-full border border-[#d6a7bc] bg-white p-2 text-[#5b2b45] transition hover:bg-[#f9eaf1]"><SocialLogo type={type} /></a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[#ead3df] py-4 text-center text-sm text-[#5f4253]">
        © 2026 EL'S BRAIDS. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
