import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Clock3, Check } from 'lucide-react';

function ServiceDetailsPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);

  useEffect(() => {
    axios.get(`/api/services/${id}`).then((res) => setService(res.data.data)).catch(console.error);
  }, [id]);

  if (!service) return <div className="mx-auto max-w-7xl px-4 py-12">Loading...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <img src={service.images?.[0]} alt={service.name} className="h-[540px] w-full rounded-[2rem] object-cover shadow-soft" />
        </div>
        <div className="rounded-[2rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7a3855]">{service.category}</p>
          <h1 className="mt-3 text-4xl font-black uppercase text-[#5b2b45]">{service.name}</h1>
          <div className="mt-5 flex items-center gap-5 text-sm text-[#5f4253]">
            <span className="flex items-center gap-2"><Clock3 size={16} /> {service.duration}</span>
            <span className="text-2xl font-bold text-[#5b2b45]">GHC {service.price}</span>
          </div>
          <p className="mt-5 text-base leading-8 text-[#5f4253]">{service.description}</p>
          <ul className="mt-6 space-y-3 text-sm text-[#5f4253]">
            <li className="flex items-center gap-2"><Check size={16} className="text-[#5b2b45]" /> Premium service quality</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-[#5b2b45]" /> Adjusted to your preferred style</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-[#5b2b45]" /> Professional finishing</li>
          </ul>
          <Link to={`/book?service=${service.id}`} className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-[#5b2b45] px-5 py-4 text-sm font-semibold text-white">BOOK THIS SERVICE</Link>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetailsPage;
