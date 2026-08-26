import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clock3, ArrowRight } from 'lucide-react';

// Curated braiding & hair care specific images for service cards
const SERVICE_FALLBACK_IMAGES = [
  // Box braids — woman with waist-length braids
  'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
  // Cornrows — close-up neat cornrow pattern
  'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
  // Salon braiding — stylist hands at work
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  // Goddess locs / faux locs
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
  // Hair treatment / moisturizing
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
  // Salon chair styling
  'https://images.unsplash.com/photo-1521590832167-7e5d18d02b3c?auto=format&fit=crop&w=800&q=80',
];

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [touchImageId, setTouchImageId] = useState(null);

  useEffect(() => {
    axios.get('/api/services').then((res) => setServices(res.data.data || [])).catch(console.error);
  }, []);

  const categories = ['All', ...new Set(services.map((service) => service.category).filter(Boolean))];
  const visibleServices = activeCategory === 'All'
    ? services
    : services.filter((service) => service.category === activeCategory);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        <img
          src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1600&q=85"
          alt="EL'S BRAIDS professional braiding services"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">Our Services</p>
            <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">Beauty &amp; Braiding Care</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

      <div className="mb-8 flex flex-wrap gap-3">
        {categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === category ? 'bg-[#5b2b45] text-white' : 'border border-[#d9bcc7] bg-white text-[#5b2b45]'}`}>{category}</button>)}
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleServices.map((service, idx) => {
          const bgImg = service.images?.[0] || SERVICE_FALLBACK_IMAGES[idx % SERVICE_FALLBACK_IMAGES.length];
          const alternateImg = service.images?.[1] || SERVICE_FALLBACK_IMAGES[(idx + 1) % SERVICE_FALLBACK_IMAGES.length];
          return (
            <div
              key={service.id}
              className="group relative overflow-hidden rounded-[1.5rem] shadow-lg"
              style={{ minHeight: '340px' }}
            >
              <div className="relative h-[340px] cursor-pointer overflow-hidden rounded-[1.5rem]" onClick={() => setTouchImageId((current) => current === service.id ? null : service.id)}>
                <img src={bgImg} alt={service.name} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:-translate-x-full ${touchImageId === service.id ? '-translate-x-full' : ''}`} />
                <img src={alternateImg} alt={`${service.name} alternate style`} className={`absolute inset-0 h-full w-full translate-x-full object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:translate-x-0 ${touchImageId === service.id ? 'translate-x-0' : ''}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h2 className="text-2xl font-bold leading-tight drop-shadow">{service.name}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">{service.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#f8dbe8]">GHC {service.price}</span>
                    <span className="flex items-center gap-1 text-white/75"><Clock3 size={14} /> {service.duration}</span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link to={`/services/${service.id}`} onClick={(event) => event.stopPropagation()} className="flex-1 rounded-full border border-white/50 px-4 py-2.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
                      View Details
                    </Link>
                    <Link to={`/book?service=${service.id}`} onClick={(event) => event.stopPropagation()} className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#5b2b45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#712f4b]">
                      Book Now <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

export default ServicesPage;
