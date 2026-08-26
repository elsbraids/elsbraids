import { useEffect, useState } from 'react';
import axios from 'axios';

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [settings, setSettings] = useState({});
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
    axios.get('/api/settings').then((response) => setSettings(response.data.data || {})).catch(console.error);
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7a3855]">Contact</p>
          <h1 className="mt-3 text-4xl font-black uppercase text-[#5b2b45]">EL'S BRAIDS</h1>
          <div className="mt-6 space-y-4 text-[#5f4253]">
            <a href={mapUrl} target="_blank" rel="noreferrer">{location}</a>
            <div className="overflow-hidden rounded-xl border border-[#ead4dd] bg-white">
              <iframe title="EL'S BRAIDS location" src={mapEmbedUrl} className="h-64 w-full border-0" loading="lazy" allowFullScreen />
            </div>
            <p>Phone: {settings.phone || '0553971315'}</p>
            <p>Email: {settings.email || 'hello@elsbraids.com'}</p>
            <p>{settings.businessHours || 'Mon - Sat: 9:00 AM - 7:00 PM'}</p>
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
          <button type="submit" disabled={submitting} className="mt-6 w-full rounded-md bg-[#5b2b45] px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{submitting ? 'Sending...' : 'Send Message'}</button>
        </form>
      </div>
    </div>
  );
}

export default ContactPage;
