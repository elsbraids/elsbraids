import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

// Curated African beauty & hair product images
const PRODUCT_FALLBACK_IMAGES = [
  // Hair oil / serum bottle — dark amber glass
  'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=80',
  // Shea butter / cream jar — luxury beauty
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80',
  // Cosmetics & skincare flat lay
  'https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=800&q=80',
  // Natural hair care products collection
  'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80',
  // Wooden hair comb & accessories
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  // Beauty serum / essential oil drop
  'https://images.unsplash.com/photo-1533577116850-9cc66cad8a9b?auto=format&fit=crop&w=800&q=80',
];

function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [addedProductId, setAddedProductId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    axios
      .get('/api/products')
      .then((res) => setProducts((res.data.data || []).filter((product) => product.isActive !== false)))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(products.map((product) => product.category).filter(Boolean))];
  const visibleProducts = activeCategory === 'All'
    ? products
    : products.filter((product) => product.category === activeCategory);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        <img
          src="https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=1600&q=85"
          alt="African beauty & hair care products at EL'S BRAIDS shop"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">Shop</p>
            <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">Beauty Products</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

      {loading && <p className="py-12 text-center text-[#5f4253]">Loading products...</p>}
      {loadError && <p className="py-12 text-center text-red-700">Unable to load products. Please refresh and try again.</p>}
      {!loading && !loadError && !products.length && <p className="py-12 text-center text-[#5f4253]">New products are coming soon.</p>}
      {!loading && !loadError && products.length > 0 && <div className="mb-8 flex flex-wrap gap-3">
        {categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === category ? 'bg-[#5b2b45] text-white' : 'border border-[#d9bcc7] bg-white text-[#5b2b45]'}`}>{category}</button>)}
      </div>}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleProducts.map((product, idx) => {
          const bgImg =
            product.images?.[0] ||
            PRODUCT_FALLBACK_IMAGES[idx % PRODUCT_FALLBACK_IMAGES.length];

          return (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-[1.5rem] shadow-lg"
              style={{ minHeight: '340px' }}
            >
              {/* Background image */}
              <img
                src={bgImg}
                alt={product.name}
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
                    to={`/products/${product.id}`}
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
      </div>
      </div>
    </div>
  );
}

export default ShopPage;
