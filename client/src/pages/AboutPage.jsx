import { useEffect, useState } from 'react';
import axios from 'axios';
import { handleImageError, optimizeImageUrl } from '../utils/image';

function AboutPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/settings').then((response) => setSettings(response.data.data || {})).catch(console.error).finally(() => setLoading(false));
  }, []);

  const heroImage = settings.heroImages?.find(Boolean) || '/hero_braids.jpg';

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        {loading ? <div className="absolute inset-0 animate-pulse bg-[#eadde2]" aria-label="Loading about image" /> : <img
          src={optimizeImageUrl(heroImage, 1600)}
          alt="About EL'S BRAIDS beauty studio"
          onError={(event) => {
            handleImageError(event)
          }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">About Us</p>
            <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">EL'S BRAIDS</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#ead4dd] bg-[#fffafc] p-8 shadow-soft">
          <p className="text-lg leading-8 text-[#5f4253]">
            EL'S BRAIDS is a premium beauty brand focused on braiding, piercing, and quality beauty services in Kumasi. Our goal is to deliver elegant, durable styles and a warm customer experience that makes every client feel confident and cared for.
          </p>
          <p className="mt-5 text-lg leading-8 text-[#5f4253]">
            We combine professional craftsmanship, beauty expertise, and polished service with a commitment to detail, comfort, and long-lasting results.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
