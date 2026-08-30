import { useEffect, useState } from 'react';
import axios from 'axios';

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const location = String(settings.location || 'Atonsu, Kumasi, Ghana').replace(/Atomsu/gi, 'Atonsu');
  const mapUrl = settings.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  const coordinateMatch = settings.googleMapsUrl?.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const mapQuery = coordinateMatch ? `${coordinateMatch[1]},${coordinateMatch[2]}` : location;
  const mapEmbedUrl = settings.googleMapsEmbedUrl || (settings.googleMapsUrl?.includes('/maps/embed')
    ? settings.googleMapsUrl
    : `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed`);

  useEffect(() => {
    axios.get('/api/settings').then((response) => setSettings(response.data.data || {})).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSent(false);
    try {
      await axios.post('/api/contact', form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      alert('Unable to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        {loading ? <div className="absolute inset-0 animate-pulse bg-[#eadde2]" aria-label="Loading contact image" /> : <img
          src={settings.heroImages?.find(Boolean) || '/hero_braids.jpg'}
          alt="Contact EL'S BRAIDS beauty salon"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/hero_braids.jpg';
          }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#f9efef]" />
        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f8dbe8]">Contact</p>
            <h1 className="mt-2 font-['Caveat',cursive] text-5xl font-bold sm:text-6xl">Get In Touch</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
            <div className="mt-2 space-y-4 text-[#5f4253]">
              <a href={mapUrl} target="_blank" rel="noreferrer" className="block font-semibold text-plum underline hover:text-mauve transition-colors">{location}</a>
              <div className="overflow-hidden rounded-xl border border-[#ead4dd] bg-white">
                <iframe title="EL'S BRAIDS location" src={mapEmbedUrl} className="h-64 w-full border-0" loading="lazy" allowFullScreen />
              </div>
              <div className="pt-2 space-y-2 text-sm">
                <p><span className="font-bold text-plum">Phone:</span> {settings.phone || '0553971315'}</p>
                <p><span className="font-bold text-plum">Email:</span> {settings.email || 'hello@elsbraids.com'}</p>
                <p><span className="font-bold text-plum">Hours:</span> {settings.businessHours || 'Mon - Sat: 9:00 AM - 7:00 PM'}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" required />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" required />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3 md:col-span-2" required />
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" className="min-h-[160px] rounded-lg border border-[#ead4dd] bg-white px-4 py-3 md:col-span-2" required />
            </div>
            {sent && <p className="mt-4 rounded-lg bg-[#edf8f1] px-4 py-3 text-sm font-semibold text-green-800">Thanks, your message has been sent.</p>}
            <button type="submit" disabled={submitting} className="mt-6 w-full rounded-md bg-[#5b2b45] px-4 py-3 text-sm font-semibold text-white hover:bg-[#712f4b] transition-colors disabled:cursor-wait disabled:opacity-60">{submitting ? 'Sending...' : 'Send Message'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
