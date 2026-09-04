import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { handleImageError, optimizeImageUrl } from '../utils/image';
import { CardGridSkeleton } from '../components/LoadingSkeleton';

const fallbackImage = '/hero_braids.jpg';

function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    document.title = "Shop | EL'S BRAIDS";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', "Shop premium beauty and hair care products from EL'S BRAIDS in Kumasi, Ghana.");
  }, []);

  useEffect(() => {
    Promise.all([axios.get('/api/products'), axios.get('/api/settings')])
      .then(([productsRes, settingsRes]) => {
        setProducts((productsRes.data.data || []).filter((product) => product.isActive !== false));
        setSettings(settingsRes.data.data || {});
      })
      .catch(() => setLoadError(true))
      .finally(() => {
        setLoading(false);
        setSettingsLoading(false);
      });
  }, []);

  const categories = ['All', ...new Set(products.map((product) => product.category).filter(Boolean))];
  const visibleProducts = activeCategory === 'All'
    ? products
    : products.filter((product) => product.category === activeCategory);
  const heroImage = settings.heroImages?.find(Boolean) || fallbackImage;

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        {settingsLoading ? <div className="absolute inset-0 animate-pulse bg-[#eadde2]" aria-label="Loading shop image" /> : <img
          src={optimizeImageUrl(heroImage, 800)}
          alt="African beauty & hair care products at EL'S BRAIDS shop"
          loading="lazy"
          decoding="async"
          onError={(event) => handleImageError(event, fallbackImage)}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">Shop</p>
            <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">Beauty Products</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

      {loading && <CardGridSkeleton />}
      {loadError && <p className="py-12 text-center text-red-700">Unable to load products. Please refresh and try again.</p>}
      {!loading && !loadError && !products.length && <p className="py-12 text-center text-[#5f4253]">New products are coming soon.</p>}
      {!loading && !loadError && products.length > 0 && <div className="mb-8 flex flex-wrap gap-3">
        {categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === category ? 'bg-[#5b2b45] text-white' : 'border border-[#d9bcc7] bg-white text-[#5b2b45]'}`}>{category}</button>)}
      </div>}
      {!loading && !loadError && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleProducts.map((product) => {
          const bgImg = product.images?.[0] || fallbackImage;

          return (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-[1.5rem] shadow-lg"
              style={{ minHeight: '340px' }}
            >
              {/* Background image */}
              <img
                src={optimizeImageUrl(bgImg, 600)}
                alt={product.name}
                onError={(event) => handleImageError(event, fallbackImage)}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay — text always readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              {/* Content overlaid on image */}
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#f8dbe8]">
                  {product.category || 'Beauty'}
                </p>
                <h2 className="mt-1 text-2xl font-bold leading-tight drop-shadow">
                  {product.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">
                  {product.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-lg font-bold text-[#f8dbe8]">GHC {product.price}</span>
                  <span className="text-white/70">{product.stock} in stock</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link
                    to={`/products/${product.id || product._id}`}
                    className="flex-1 rounded-full border border-white/50 px-4 py-2.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Details
                  </Link>
                  <button
                    disabled={!product.stock}
                    onClick={() => {
                      addToCart(product, 1);
                      setAddedProductId(product.id);
                      window.setTimeout(() => setAddedProductId(null), 1400);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#5b2b45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#712f4b] disabled:cursor-not-allowed disabled:bg-[#bba3ad]"
                  >
                    <ShoppingBag size={15} /> {product.stock ? (addedProductId === product.id ? 'Added' : 'Add to cart') : 'Sold out'}
                  </button>
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

export default ShopPage;
