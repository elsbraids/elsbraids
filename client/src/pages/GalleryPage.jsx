import { useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, X } from 'lucide-react';

const categories = ['All', 'Braids', 'Curls', 'Piercing', 'Other'];

function GalleryPage() {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewingItem, setViewingItem] = useState(null);

  useEffect(() => {
    Promise.all([axios.get('/api/gallery'), axios.get('/api/settings')])
      .then(([galleryRes, settingsRes]) => {
        setItems(galleryRes.data.data || []);
        setSettings(settingsRes.data.data || {});
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const fallbackImage = settings.heroImages?.find(Boolean) || '/hero_braids.jpg';

  useEffect(() => {
    if (!viewingItem) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setViewingItem(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [viewingItem]);

  const filtered = activeCategory === 'All' ? items : items.filter((item) => item.category === activeCategory);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        {loading ? <div className="absolute inset-0 animate-pulse bg-[#eadde2]" aria-label="Loading gallery image" /> : <img
          src={fallbackImage}
          alt="EL'S BRAIDS beauty gallery"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/hero_braids.jpg';
          }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">Gallery</p>
            <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">Recent Styles</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading && <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3"><div className="h-[360px] animate-pulse rounded-[1.5rem] bg-[#eadde2]" /><div className="h-[360px] animate-pulse rounded-[1.5rem] bg-[#eadde2]" /><div className="h-[360px] animate-pulse rounded-[1.5rem] bg-[#eadde2]" /></div>}
        {loadError && <p className="py-8 text-center text-red-700">Unable to load the gallery. Please refresh and try again.</p>}
        {!loading && !loadError && <div className="mb-8 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === category ? 'bg-[#5b2b45] text-white' : 'border border-[#d9bcc7] bg-white text-[#5b2b45]'}`}
            >
              {category}
            </button>
          ))}
        </div>}

        {!loading && !loadError && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="group relative min-h-[360px] overflow-hidden rounded-[1.5rem] shadow-lg">
              <img src={item.image || fallbackImage} alt={item.title} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage; }} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f8dbe8]">{item.category}</p>
                <h3 className="mt-2 text-2xl font-bold leading-tight drop-shadow">{item.title}</h3>
                {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">{item.description}</p>}
                <button type="button" onClick={() => setViewingItem(item)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/30 transition hover:bg-white hover:text-[#5b2b45]">
                  View <Eye size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>}

        {viewingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={`${viewingItem.title} enlarged view`} onClick={() => setViewingItem(null)}>
            <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
              <img src={viewingItem.image || fallbackImage} alt={viewingItem.title} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage; }} className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
              <button type="button" onClick={() => setViewingItem(null)} aria-label="Close enlarged image" className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white transition hover:bg-black"><X size={20} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GalleryPage;
