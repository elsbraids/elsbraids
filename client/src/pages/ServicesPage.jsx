import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clock3, ArrowRight } from 'lucide-react';
import { handleImageError, optimizeImageUrl } from '../utils/image';
import { CardGridSkeleton } from '../components/LoadingSkeleton';

const fallbackImage = '/hero_braids.jpg';

const getSafeImageList = (images) => {
  if (!Array.isArray(images)) return [];
  return images.filter((image) => typeof image === 'string' && image.trim().length > 0);
};

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeImageMap, setActiveImageMap] = useState({});

  useEffect(() => {
    document.title = "Services | EL'S BRAIDS";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', "Explore all braiding, beauty and piercing services offered by EL'S BRAIDS in Kumasi, Ghana.");
  }, []);

  useEffect(() => {
    Promise.all([axios.get('/api/services'), axios.get('/api/settings')])
      .then(([servicesRes, settingsRes]) => {
        setServices(servicesRes.data.data || []);
        setSettings(settingsRes.data.data || {});
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const heroImage = settings.heroImages?.find(Boolean) || fallbackImage;

  const categories = ['All', ...new Set(services.map((service) => service.category).filter(Boolean))];
  const visibleServices = activeCategory === 'All'
    ? services
    : services.filter((service) => service.category === activeCategory);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        {loading ? <div className="absolute inset-0 animate-pulse bg-[#eadde2]" aria-label="Loading services image" /> : <img src={optimizeImageUrl(heroImage, 800)} alt="EL'S BRAIDS professional braiding services" loading="lazy" decoding="async" onError={(event) => handleImageError(event, fallbackImage)} className="absolute inset-0 h-full w-full object-cover object-center" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">Our Services</p>
            <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">Beauty &amp; Braiding Care</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

      {loading && <CardGridSkeleton />}
      {loadError && <p className="py-8 text-center text-red-700">Unable to load services. Please refresh and try again.</p>}
      {!loading && !loadError && <div className="mb-8 flex flex-wrap gap-3">
        {categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === category ? 'bg-[#5b2b45] text-white' : 'border border-[#d9bcc7] bg-white text-[#5b2b45]'}`}>{category}</button>)}
      </div>}
      {!loading && !loadError && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleServices.map((service) => {
          const safeImages = getSafeImageList(service.images);
          const primaryImage = safeImages[0] || fallbackImage;
          const secondaryImage = safeImages[1] || primaryImage;
          const activeImageIndex = activeImageMap[service.id] === 1 ? 1 : 0;

          const toggleImage = () => {
            if (safeImages.length < 2) return;
            setActiveImageMap((current) => ({
              ...current,
              [service.id]: current[service.id] === 1 ? 0 : 1,
            }));
          };

          return (
            <div
              key={service.id}
              className="group relative overflow-hidden rounded-[1.5rem] shadow-lg"
              style={{ minHeight: '340px' }}
            >
              <div className="relative h-[340px] cursor-pointer overflow-hidden rounded-[1.5rem]" onClick={toggleImage}>
                <img
                  src={optimizeImageUrl(activeImageIndex === 0 ? primaryImage : secondaryImage, 600)}
                  alt={service.name}
                  onError={(event) => handleImageError(event, fallbackImage)}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${activeImageIndex === 0 ? 'opacity-100' : 'opacity-0'}`}
                />
                {safeImages.length > 1 && (
                  <img
                    src={optimizeImageUrl(activeImageIndex === 1 ? secondaryImage : primaryImage, 600)}
                    alt={`${service.name} alternate style`}
                    onError={(event) => handleImageError(event, fallbackImage)}
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${activeImageIndex === 1 ? 'opacity-100' : 'opacity-0'}`}
                  />
                )}
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
      </div>}
      </div>
    </div>
  );
}

export default ServicesPage;
