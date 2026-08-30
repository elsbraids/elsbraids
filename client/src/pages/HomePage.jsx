import { Link } from 'react-router-dom';
import { Clock3, MapPin, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { handleImageError, imageFallback, optimizeImageUrl } from '../utils/image';

const heroImage = imageFallback;

const serviceFallbackImage = heroImage;

function HomePage() {
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [touchImageId, setTouchImageId] = useState(null);
  const uploadedHeroImages = settings.heroImages?.filter(Boolean) || [];
  const displayedHeroSlides = uploadedHeroImages.map((image, index) => ({
    image,
    alt: `EL'S BRAIDS hero image ${index + 1}`,
  }));

  const showPreviousHero = () => {
    if (displayedHeroSlides.length < 2) return;
    setActiveHeroSlide((current) => (current - 1 + displayedHeroSlides.length) % displayedHeroSlides.length);
  };

  const showNextHero = () => {
    if (displayedHeroSlides.length < 2) return;
    setActiveHeroSlide((current) => (current + 1) % displayedHeroSlides.length);
  };

  useEffect(() => {
    setActiveHeroSlide((current) => displayedHeroSlides.length ? current % displayedHeroSlides.length : 0);
    if (displayedHeroSlides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % displayedHeroSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [displayedHeroSlides.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, settingsRes] = await Promise.all([
          axios.get('/api/services'),
          axios.get('/api/settings'),
        ]);
        setServices((servicesRes.data.data || []).slice(0, 6));
        setSettings(settingsRes.data.data || {});
      } catch (error) {
        console.error('Failed to load home data', error);
        setServicesError(true);
      } finally {
        setSettingsLoading(false);
        setServicesLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative isolate min-h-[680px] overflow-hidden sm:min-h-[720px]">
        {settingsLoading ? (
          <div className="absolute inset-0 -z-20 animate-pulse bg-[#eadde2]" aria-label="Loading hero image" />
        ) : displayedHeroSlides.map((slide, index) => (
          <img
            key={slide.image}
            src={optimizeImageUrl(slide.image, 1600)}
            alt={slide.alt}
            aria-hidden={index !== activeHeroSlide}
            onError={(event) => {
              handleImageError(event);
            }}
            className={`absolute inset-0 -z-20 h-full w-full object-cover object-center transition-opacity duration-1000 ${index === activeHeroSlide ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {/* deep gradient left-to-right for text legibility */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(30,8,20,0.92)_0%,rgba(55,18,40,0.72)_45%,rgba(30,8,20,0.18)_100%)]" />

        <div className="mx-auto flex min-h-[680px] max-w-7xl flex-col justify-between px-4 pb-16 pt-12 sm:min-h-[720px] sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#f8dbe8] drop-shadow-md sm:text-sm">
              Premium Beauty Studio · Kumasi, Ghana
            </p>
          </div>
          
          <div className="mt-auto w-full max-w-2xl text-white">
            <h1 className="font-['Twinkle_Star',cursive] text-7xl leading-[0.8] drop-shadow-xl sm:text-8xl lg:text-[9rem]">
              EL'S <span className="block">BRAIDS</span>
            </h1>
            <p className="mt-5 text-xl italic leading-snug text-[#f8dbe8] drop-shadow-md sm:mt-6 sm:text-2xl">
              Beautiful Hair. Beautiful You.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-white/90 drop-shadow-md sm:text-base">
              <MapPin size={16} className="shrink-0 text-[#f8dbe8]" />
              <span>{String(settings.location || 'Atonsu, Kumasi, Ghana').replace(/Atomsu/gi, 'Atonsu')}</span>
            </div>
          </div>

          <div className="mt-10 w-full max-w-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Link
                to="/book"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-bold tracking-wide text-[#5b2b45] shadow-xl transition hover:scale-105 hover:bg-[#f8dbe8] sm:w-auto"
              >
                BOOK NOW
              </Link>
              <Link
                to="/shop"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/60 bg-white/10 px-8 py-4 text-sm font-bold tracking-wide text-white shadow-xl backdrop-blur-md transition hover:bg-white/20 sm:w-auto"
              >
                SHOP PRODUCTS
              </Link>
            </div>
          </div>
        </div>

        {displayedHeroSlides.length > 1 && (
          <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2" aria-label="Hero image slides">
            {displayedHeroSlides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => setActiveHeroSlide(index)}
                aria-label={`Show hero image ${index + 1}`}
                aria-current={index === activeHeroSlide ? 'true' : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${index === activeHeroSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── SERVICES GRID ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#7a3855]">Our Services</p>
          <h2 className="mt-3 text-3xl font-bold text-[#5b2b45]">Signature beauty care</h2>
        </div>

        {servicesLoading && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"><div className="h-[340px] animate-pulse rounded-[1.5rem] bg-[#eadde2]" /><div className="h-[340px] animate-pulse rounded-[1.5rem] bg-[#eadde2]" /><div className="h-[340px] animate-pulse rounded-[1.5rem] bg-[#eadde2]" /></div>}
        {servicesError && <p className="py-8 text-center text-red-700">Unable to load services. Please refresh and try again.</p>}
        {!servicesLoading && !servicesError && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, idx) => {
            const bgImg = service.images?.[0] || serviceFallbackImage;
            const alternateImg = service.images?.[1] || bgImg;
            const cardContent = (
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-2xl font-bold leading-tight drop-shadow">{service.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">{service.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#f8dbe8]">GHC {service.price}</span>
                  <span className="flex items-center gap-1 text-white/75">
                    <Clock3 size={14} /> {service.duration}
                  </span>
                </div>
                <Link
                  to={`/book?service=${service.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/30 transition hover:bg-white hover:text-[#5b2b45]"
                >
                  Book Now <ArrowRight size={15} />
                </Link>
              </div>
            );
            return (
              <div
                key={service.id}
                className="group relative overflow-hidden rounded-[1.5rem] shadow-lg"
                style={{ minHeight: '340px' }}
              >
                <div className="relative h-[340px] cursor-pointer overflow-hidden rounded-[1.5rem]" onClick={() => setTouchImageId((current) => current === service.id ? null : service.id)}>
                  <img src={optimizeImageUrl(bgImg)} alt={service.name} onError={(event) => handleImageError(event, serviceFallbackImage)} loading="lazy" className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:-translate-x-full ${touchImageId === service.id ? '-translate-x-full' : ''}`} />
                  <img src={optimizeImageUrl(alternateImg)} alt={`${service.name} alternate style`} onError={(event) => handleImageError(event, serviceFallbackImage)} loading="lazy" className={`absolute inset-0 h-full w-full translate-x-full object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:translate-x-0 ${touchImageId === service.id ? 'translate-x-0' : ''}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  {cardContent}
                </div>
              </div>
            );
          })}
        </div>}
      </section>
    </div>
  );
}

export default HomePage;
