import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

const bookingDraftKey = 'elsBookingDraft';

function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('service') || '');
  const [mapQuery, setMapQuery] = useState('Atonsu, Kumasi, Ghana');
  const [form, setForm] = useState(() => {
    try {
      const draft = sessionStorage.getItem(bookingDraftKey);
      if (draft) {
        sessionStorage.removeItem(bookingDraftKey);
        return JSON.parse(draft);
      }
    } catch { }
    return { customerName: '', phone: '', email: '', serviceName: '', date: '', time: timeSlots[0], location: 'Atonsu, Kumasi, Ghana', googleLocation: 'Atonsu, Kumasi, Ghana', notes: '', paymentOption: 'full' };
  });
  const [isPaystackReady, setIsPaystackReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setIsPaystackReady(true);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    axios.get('/api/services').then((res) => {
      const list = res.data.data || [];
      setServices(list);
      const serviceFromQuery = list.find((item) => item.id === selectedServiceId);
      if (serviceFromQuery) {
        setForm((prev) => ({ ...prev, serviceName: serviceFromQuery.name }));
      }
    }).catch(console.error);
  }, [selectedServiceId]);

  useEffect(() => {
    if (!selectedServiceId) return;
    const match = services.find((service) => service.id === selectedServiceId);
    if (match) {
      setForm((prev) => ({ ...prev, serviceName: match.name }));
    }
  }, [selectedServiceId, services]);

  const selectedService = useMemo(
    () => services.find((service) => service.name === form.serviceName) || services.find((service) => service.id === selectedServiceId) || null,
    [form.serviceName, services, selectedServiceId],
  );

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const googleCoordinates = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        const currentLocation = `Approximate location (${googleCoordinates})`;
        setMapQuery(googleCoordinates);
        setForm((prev) => ({ ...prev, googleLocation: currentLocation, location: currentLocation }));
      },
      () => {
        alert('Unable to access your current location accurately. Please search on Google Maps or enter the address manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.get('/api/customers/me', { withCredentials: true });
      if (!selectedService || !window.PaystackPop) {
        alert('Payment is still loading. Please wait a moment and try again.');
        return;
      }
      const resolvedLocation = form.googleLocation || form.location || mapQuery || 'Atonsu, Kumasi, Ghana';
      const paymentAmount = Number(selectedService.price) * (form.paymentOption === 'half' ? 0.5 : 1);
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        email: form.email,
        amount: Math.round(paymentAmount * 100),
        currency: 'GHS',
        ref: `els-booking-${Date.now()}`,
        callback: async (payment) => {
          try {
            const response = await axios.post('/api/bookings', { ...form, serviceName: selectedService.name, location: resolvedLocation, googleLocation: resolvedLocation, paymentReference: payment.reference }, { withCredentials: true });
            alert(`Booking created successfully. Reference: ${response.data.data.reference}`);
            setForm((prev) => ({ ...prev, customerName: '', phone: '', email: '', date: '', time: timeSlots[0], location: '', googleLocation: '', notes: '' }));
          } catch (error) {
            alert(error.response?.data?.message || 'Payment succeeded but booking could not be saved. Please contact support.');
          } finally {
            setIsSubmitting(false);
          }
        },
        onClose: () => setIsSubmitting(false),
      });
      handler.openIframe();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        sessionStorage.setItem(bookingDraftKey, JSON.stringify(form));
        alert('Please sign in before confirming your booking.');
        navigate('/signin', { state: { from: `/book${window.location.search}` } });
        return;
      }
      console.error(error);
      alert('Unable to create booking. Please try again.');
    } finally {
      if (!window.PaystackPop) setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* ── HERO ── */}
      <section className="border-b border-[#ead4dd] bg-[#fffafc]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a3855]">Book Appointment</p>
          <h1 className="mt-2 text-4xl font-black uppercase text-[#5b2b45] sm:text-5xl">Make it yours</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f4253]">Choose your service, select your payment option, and tell us how to prepare for your visit.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="order-2 space-y-5 rounded-[2rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft lg:order-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Service</label>
              <select
                value={selectedServiceId || form.serviceName}
                onChange={(e) => {
                  const chosen = services.find((service) => service.id === e.target.value) || null;
                  setSelectedServiceId(e.target.value);
                  setForm((prev) => ({ ...prev, serviceName: chosen ? chosen.name : e.target.value }));
                }}
                className="w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3"
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-[#5b2b45]">Payment option</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-lg border p-4 ${form.paymentOption === 'half' ? 'border-[#5b2b45] bg-[#f9eaf1]' : 'border-[#ead4dd] bg-white'}`}>
                  <input type="radio" name="paymentOption" value="half" checked={form.paymentOption === 'half'} onChange={(e) => setForm({ ...form, paymentOption: e.target.value })} className="mr-2" />
                  Half payment: GHC {selectedService ? Number(selectedService.price) / 2 : 0}
                </label>
                <label className={`cursor-pointer rounded-lg border p-4 ${form.paymentOption === 'full' ? 'border-[#5b2b45] bg-[#f9eaf1]' : 'border-[#ead4dd] bg-white'}`}>
                  <input type="radio" name="paymentOption" value="full" checked={form.paymentOption === 'full'} onChange={(e) => setForm({ ...form, paymentOption: e.target.value })} className="mr-2" />
                  Full payment: GHC {selectedService ? selectedService.price : 0}
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Full name</label>
              <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3" required />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Preferred date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Preferred time</label>
              <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3">
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Search Google Maps location</label>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={mapQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMapQuery(value);
                    setForm((prev) => ({ ...prev, googleLocation: value, location: value || 'Atonsu, Kumasi, Ghana' }));
                  }}
                  placeholder="Search for a place, landmark, or address"
                  className="flex-1 rounded-lg border border-[#ead4dd] bg-white px-4 py-3"
                />
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="rounded-lg border border-[#7a3855] bg-[#f9eaf1] px-4 py-3 text-sm font-semibold text-[#5b2b45]"
                >
                  Use my current location
                </button>
              </div>
            </div>

            <div className="md:col-span-2 overflow-hidden rounded-2xl border border-[#ead4dd] bg-white">
              <iframe
                title="Google Maps location finder"
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery || 'Atonsu, Kumasi, Ghana')}&z=14&output=embed`}
                className="h-64 w-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery || 'Atonsu, Kumasi, Ghana')}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[#5b2b45] underline"
              >
                Open in Google Maps
              </a>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#5b2b45]">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[110px] w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3" placeholder="Tell us anything important about your appointment" />
            </div>
          </div>
        </div>

        <aside className="order-1 rounded-[2rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft lg:order-1">
          <img src={selectedService?.images?.[0] || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85'} alt={selectedService?.name || "EL'S BRAIDS booking"} className="mb-5 h-64 w-full rounded-2xl object-cover" />
          <h2 className="text-2xl font-bold text-[#5b2b45]">Booking Summary</h2>
          <div className="mt-5 space-y-3 text-sm text-[#5f4253]">
            <div className="flex justify-between"><span>Service</span><span>{selectedService?.name || form.serviceName || 'Not selected'}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{form.date || 'Not selected'}</span></div>
            <div className="flex justify-between"><span>Time</span><span>{form.time}</span></div>
            <div className="flex justify-between"><span>Location</span><span>{form.googleLocation || form.location || mapQuery || 'Atonsu, Kumasi, Ghana'}</span></div>
            <div className="flex justify-between border-t border-[#ead4dd] pt-3 font-semibold text-[#5b2b45]"><span>{form.paymentOption === 'half' ? 'Deposit due' : 'Full payment due'}</span><span>GHC {selectedService ? Number(selectedService.price) * (form.paymentOption === 'half' ? 0.5 : 1) : 0}</span></div>
          </div>
        </aside>
        <div className="order-3 flex justify-end lg:col-span-2">
          <button type="submit" disabled={isSubmitting || !isPaystackReady} className="w-full rounded-full bg-[#5b2b45] px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#712f4b] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-64">{isSubmitting ? 'PROCESSING PAYMENT...' : !isPaystackReady ? 'LOADING PAYMENT...' : 'PAY & CONFIRM BOOKING'}</button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default BookingPage;
