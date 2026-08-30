import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { handleImageError, optimizeImageUrl } from '../utils/image';

function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    axios.get(`/api/products/${id}`).then((res) => setProduct(res.data.data)).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-12 text-[#5f4253]">Loading product...</div>;
  if (notFound || !product) return <div className="mx-auto max-w-7xl px-4 py-12"><p className="text-[#5f4253]">Product not found.</p><Link to="/shop" className="mt-5 inline-flex rounded-md bg-[#5b2b45] px-5 py-3 text-sm font-semibold text-white">Back to shop</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <img src={optimizeImageUrl(product.images?.[0] || '/hero_braids.jpg')} alt={product.name} onError={(event) => handleImageError(event)} loading="lazy" className="h-[520px] w-full rounded-[2rem] object-cover shadow-soft" />
        </div>
        <div className="rounded-[2rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a3855]">{product.category}</p>
          <h1 className="mt-3 text-4xl font-black uppercase text-[#5b2b45]">{product.name}</h1>
          <p className="mt-5 text-2xl font-bold text-[#5b2b45]">GHC {product.price}</p>
          <p className="mt-5 text-base leading-8 text-[#5f4253]">{product.description}</p>
          <div className="mt-5 flex items-center gap-3">
            <label className="text-sm text-[#5f4253]">Qty</label>
            <input type="number" min="1" max={product.stock} value={quantity} onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, Number(e.target.value))))} className="w-20 rounded-md border border-[#d9bcc7] bg-white px-3 py-2 text-center" />
          </div>
          <button disabled={!product.stock} onClick={() => addToCart(product, quantity)} className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-[#5b2b45] px-5 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#bba3ad]"><ShoppingBag size={18} /> {product.stock ? 'Add To Cart' : 'Sold Out'}</button>
          <Link to="/shop" className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[#7a3855] px-5 py-4 text-sm font-semibold text-[#5b2b45]">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsPage;
