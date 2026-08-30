import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  User,
  Phone,
  Mail,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Lock,
  ShieldCheck,
  Map
} from 'lucide-react';

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

// Fallback images matching El's Braids styling
const SERVICE_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521590832167-7e5d18d02b3c?auto=format&fit=crop&w=800&q=80',
];

function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Data Loading and Core states
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('service') || '');
  const [mapQuery, setMapQuery] = useState('Atonsu, Kumasi, Ghana');
  
  // Form State
  const [form, setForm] = useState(() => {
    try {
      const draft = sessionStorage.getItem(bookingDraftKey);
      if (draft) {
        sessionStorage.removeItem(bookingDraftKey);
        return JSON.parse(draft);
      }
    } catch { }
    return {
      customerName: '',
      phone: '',
      email: '',
      serviceName: '',
      date: '',
      time: timeSlots[0],
      location: 'Atonsu, Kumasi, Ghana',
      googleLocation: 'Atonsu, Kumasi, Ghana',
      notes: '',
      paymentOption: 'full'
    };
  });

  // UX Feedback states
  const [isPaystackReady, setIsPaystackReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [mapError, setMapError] = useState('');

  // Load Paystack Inline script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setIsPaystackReady(true);
    script.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Failed to load Paystack payment system. Please check your connection.'
      });
    };
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (err) {
        // Safe check if script was already removed or doesn't exist
      }
    };
  }, []);

  // Fetch Services from database
  useEffect(() => {
    setIsLoadingServices(true);
    axios.get('/api/services')
      .then((res) => {
        const list = res.data.data || [];
        setServices(list);
        
        // Match serviceName from query service ID if present
        const serviceFromQuery = list.find((item) => item.id === selectedServiceId);
        if (serviceFromQuery) {
          setForm((prev) => ({ ...prev, serviceName: serviceFromQuery.name }));
        }
      })
      .catch((err) => {
        console.error(err);
        setStatusMessage({
          type: 'error',
          text: 'Unable to retrieve service catalog. Please refresh the page.'
        });
      })
      .finally(() => {
        setIsLoadingServices(false);
      });
  }, [selectedServiceId]);

  // Synchronize chosen service details
  useEffect(() => {
    if (!selectedServiceId) return;
    const match = services.find((service) => service.id === selectedServiceId);
    if (match) {
      setForm((prev) => ({ ...prev, serviceName: match.name }));
    }
  }, [selectedServiceId, services]);

  // Calculate selected service memo
  const selectedService = useMemo(
    () => services.find((service) => service.name === form.serviceName) || services.find((service) => service.id === selectedServiceId) || null,
    [form.serviceName, services, selectedServiceId],
  );

  // Validate form fields prior to submitting/payment
  const validateForm = () => {
    const newErrors = {};

    if (!form.customerName || form.customerName.trim().length < 2) {
      newErrors.customerName = 'Please enter your full name (minimum 2 characters).';
    }

    const phoneRegex = /^[+\d\s-]{7,20}$/;
    if (!form.phone || !phoneRegex.test(form.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (at least 7 digits, digits and spaces only).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!selectedService) {
      newErrors.serviceName = 'Please select a service to book.';
    }

    if (!form.date) {
      newErrors.date = 'Please select a date for your appointment.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(form.date);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Appointment date cannot be in the past.';
      }
    }

    if (!form.time) {
      newErrors.time = 'Please select a preferred time slot.';
    }

    if (!form.location || !form.location.trim()) {
      newErrors.location = 'Please enter a location.';
    }

    return Object.keys(newErrors).length > 0 ? newErrors : null;
  };

  // Get current device coordinates
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setMapError('');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const googleCoordinates = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        const currentLocation = `Approximate location (${googleCoordinates})`;
        setMapQuery(googleCoordinates);
        setForm((prev) => ({
          ...prev,
          googleLocation: currentLocation,
          location: currentLocation
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        setMapError('Unable to access your location. Please enter your location manually or search.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  // Handle form submission and Paystack integration
  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage(null);
    setMapError('');

    // Trigger local client side validations
    const formErrors = validateForm();
    if (formErrors) {
      setErrors(formErrors);
      setStatusMessage({
        type: 'error',
        text: 'Please resolve the errors highlighted in red before submitting.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    
    try {
      // Check customer session authentication state
      await axios.get('/api/customers/me', { withCredentials: true });
      
      if (!selectedService || !window.PaystackPop) {
        setStatusMessage({
          type: 'error',
          text: 'Payment gateway is still loading. Please wait a moment and try again.'
        });
        setIsSubmitting(false);
        return;
      }

      const resolvedLocation = form.googleLocation || form.location || mapQuery || 'Atonsu, Kumasi, Ghana';
      const servicePrice = Number(selectedService.price) || 0;
      const paymentAmount = servicePrice * (form.paymentOption === 'half' ? 0.5 : 1);
      
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        email: form.email,
        amount: Math.round(paymentAmount * 100),
        currency: 'GHS',
        ref: `els-booking-${Date.now()}`,
        callback: async (payment) => {
          try {
            const response = await axios.post('/api/bookings', {
              ...form,
              serviceName: selectedService.name,
              location: resolvedLocation,
              googleLocation: resolvedLocation,
              paymentReference: payment.reference
            }, { withCredentials: true });

            setStatusMessage({
              type: 'success',
              text: `Booking created successfully! Reference: ${response.data.data.reference}`
            });
            
            // Clear form
            setForm({
              customerName: '',
              phone: '',
              email: '',
              serviceName: '',
              date: '',
              time: timeSlots[0],
              location: 'Atonsu, Kumasi, Ghana',
              googleLocation: 'Atonsu, Kumasi, Ghana',
              notes: '',
              paymentOption: 'full'
            });
            setSelectedServiceId('');
            setMapQuery('Atonsu, Kumasi, Ghana');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (error) {
            console.error(error);
            setStatusMessage({
              type: 'error',
              text: error.response?.data?.message || 'Payment succeeded but booking could not be saved. Please contact support immediately.'
            });
          } finally {
            setIsSubmitting(false);
          }
        },
        onClose: () => {
          setIsSubmitting(false);
          setStatusMessage({
            type: 'error',
            text: 'Payment window was closed. Your appointment reservation was not completed.'
          });
        },
      });
      handler.openIframe();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // User not logged in, cache the form state as a draft in session storage
        sessionStorage.setItem(bookingDraftKey, JSON.stringify(form));
        setStatusMessage({
          type: 'error',
          text: 'Authentication required. Redirecting you to the sign-in page to save your draft...'
        });
        setTimeout(() => {
          navigate('/signin', { state: { from: `/book${window.location.search}` } });
        }, 2500);
        return;
      }
      console.error(error);
      setStatusMessage({
        type: 'error',
        text: 'Unable to communicate with the server. Please check your network and try again.'
      });
      setIsSubmitting(false);
    }
  };

  // Pricing calculations
  const totalServicePrice = selectedService ? (Number(selectedService.price) || 0) : 0;
  const depositPrice = totalServicePrice * 0.5;
  const totalDueToday = form.paymentOption === 'half' ? depositPrice : totalServicePrice;
  const remainingBalance = form.paymentOption === 'half' ? depositPrice : 0;

  return (
    <div className="min-h-screen bg-[#f9efef]/40">
      {/* ── HERO BANNER ── */}
      <section className="border-b border-blush/60 bg-gradient-to-br from-cream via-[#fffafc] to-rose/10">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f9eaf1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-mauve">
            <Sparkles className="h-3 w-3" /> Book Appointment
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-plum sm:text-5xl">
            Make it <span className="font-['Twinkle_Star',cursive] font-normal normal-case text-mauve">yours</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/80 sm:text-base">
            Select your preferred braiding service, reserve your date and time, and specify details. Our master braiders are ready to style you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* ── STATUS MESSAGES ── */}
        {statusMessage && (
          <div
            className={`mb-8 flex items-start gap-3.5 rounded-2xl p-5 border shadow-sm transition-all duration-300 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-sm leading-tight">
                {statusMessage.type === 'success' ? 'Success Notification' : 'Attention Required'}
              </h4>
              <p className="mt-1 text-sm leading-relaxed">{statusMessage.text}</p>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold underline cursor-pointer hover:opacity-85"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          
          {/* ── LEFT COLUMN: STEPPED FIELDS ── */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* STEP 1: SERVICE & PAYMENT SELECTION */}
            <div className="group rounded-3xl border border-rose/30 bg-white p-6 shadow-soft transition-colors duration-300 hover:border-rose/50 md:p-8">
              <div className="mb-6 flex items-center gap-3.5 border-b border-blush/20 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fffafc] border border-blush/40 text-mauve shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-plum">1. Choose Braiding Service</h3>
                  <p className="text-xs text-gray-500">Pick a style and decide your payment plan</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-charcoal">Select Service</label>
                  {isLoadingServices ? (
                    <div className="flex h-12 w-full animate-pulse rounded-xl bg-gray-100" />
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedServiceId || (selectedService ? selectedService.id : '')}
                        onChange={(e) => {
                          const chosen = services.find((service) => service.id === e.target.value) || null;
                          setSelectedServiceId(e.target.value);
                          setForm((prev) => ({
                            ...prev,
                            serviceName: chosen ? chosen.name : e.target.value
                          }));
                          if (errors.serviceName) {
                            setErrors((prev) => ({ ...prev, serviceName: null }));
                          }
                        }}
                        className={`w-full appearance-none rounded-xl border bg-white pl-4 pr-10 py-3 text-sm text-charcoal outline-none transition-all cursor-pointer ${
                          errors.serviceName ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-blush/60 focus:border-plum focus:ring-4 focus:ring-plum/5'
                        }`}
                      >
                        <option value="">Select a braiding service...</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} (GHC {service.price})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mauve" />
                    </div>
                  )}
                  {errors.serviceName && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.serviceName}
                    </p>
                  )}
                </div>

                {/* Service Detail Box */}
                {selectedService && (
                  <div className="rounded-2xl border border-blush/40 bg-[#fffafc]/60 p-4 shadow-sm animate-fadeIn">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-plum">{selectedService.name}</h4>
                        {selectedService.description && (
                          <p className="mt-1 text-xs text-gray-600 leading-normal line-clamp-2">
                            {selectedService.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block rounded bg-rose/30 px-2 py-0.5 text-xs font-bold text-mauve">
                          GHC {selectedService.price}
                        </span>
                      </div>
                    </div>
                    {selectedService.duration && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-mauve">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Approximate time: {selectedService.duration}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Options radio cards */}
                <div>
                  <span className="mb-2 block text-sm font-semibold text-charcoal">Payment Option</span>
                  <div className="grid gap-4 sm:grid-cols-2">
                    
                    <label
                      className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition-all duration-300 ${
                        form.paymentOption === 'half'
                          ? 'border-plum bg-rose/5 shadow-sm ring-1 ring-plum/10'
                          : 'border-blush/40 bg-white hover:border-rose/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-plum">50% Deposit</span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                            form.paymentOption === 'half'
                              ? 'border-plum bg-plum text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {form.paymentOption === 'half' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="half"
                        checked={form.paymentOption === 'half'}
                        onChange={(e) => setForm({ ...form, paymentOption: e.target.value })}
                        className="sr-only"
                      />
                      <p className="text-xs text-gray-500 leading-normal mb-3">
                        Pay half now to confirm the reservation, and clear the balance at the salon.
                      </p>
                      <div className="mt-auto font-extrabold text-charcoal">
                        GHC {selectedService ? (totalServicePrice / 2).toFixed(2) : '0.00'}
                      </div>
                    </label>

                    <label
                      className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition-all duration-300 ${
                        form.paymentOption === 'full'
                          ? 'border-plum bg-rose/5 shadow-sm ring-1 ring-plum/10'
                          : 'border-blush/40 bg-white hover:border-rose/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-plum">Full Payment</span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                            form.paymentOption === 'full'
                              ? 'border-plum bg-plum text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {form.paymentOption === 'full' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="full"
                        checked={form.paymentOption === 'full'}
                        onChange={(e) => setForm({ ...form, paymentOption: e.target.value })}
                        className="sr-only"
                      />
                      <p className="text-xs text-gray-500 leading-normal mb-3">
                        Pay the full amount today and enjoy a completely checkout-free visit.
                      </p>
                      <div className="mt-auto font-extrabold text-charcoal">
                        GHC {selectedService ? totalServicePrice.toFixed(2) : '0.00'}
                      </div>
                    </label>

                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: DATE & TIME */}
            <div className="group rounded-3xl border border-rose/30 bg-white p-6 shadow-soft transition-colors duration-300 hover:border-rose/50 md:p-8">
              <div className="mb-6 flex items-center gap-3.5 border-b border-blush/20 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fffafc] border border-blush/40 text-mauve shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-plum">2. Select Date &amp; Time</h3>
                  <p className="text-xs text-gray-500">Pick an open slot for your session</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-charcoal">Preferred Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => {
                      setForm({ ...form, date: e.target.value });
                      if (errors.date) {
                        setErrors((prev) => ({ ...prev, date: null }));
                      }
                    }}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-charcoal outline-none transition-all ${
                      errors.date ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-blush/60 focus:border-plum focus:ring-4 focus:ring-plum/5'
                    }`}
                  />
                  {errors.date && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.date}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-charcoal">Preferred Time Slot</label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {timeSlots.map((slot) => {
                      const isSelected = form.time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, time: slot }));
                            if (errors.time) {
                              setErrors((prev) => ({ ...prev, time: null }));
                            }
                          }}
                          className={`rounded-xl border py-2.5 text-xs font-bold transition-all duration-200 text-center ${
                            isSelected
                              ? 'bg-plum border-plum text-white shadow-md shadow-plum/10'
                              : 'bg-white border-blush/60 text-charcoal hover:border-plum/40 hover:bg-rose/5'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  {errors.time && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.time}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: LOCATION */}
            <div className="group rounded-3xl border border-rose/30 bg-white p-6 shadow-soft transition-colors duration-300 hover:border-rose/50 md:p-8">
              <div className="mb-6 flex items-center gap-3.5 border-b border-blush/20 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fffafc] border border-blush/40 text-mauve shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-plum">3. Location Details</h3>
                  <p className="text-xs text-gray-500">Provide address or find your coordinates</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-charcoal">Search Google Maps location</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <input
                        value={mapQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMapQuery(value);
                          setForm((prev) => ({
                            ...prev,
                            googleLocation: value,
                            location: value || 'Atonsu, Kumasi, Ghana'
                          }));
                          if (errors.location) {
                            setErrors((prev) => ({ ...prev, location: null }));
                          }
                        }}
                        placeholder="Search for a landmark, street, or city"
                        className={`w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm text-charcoal outline-none transition-all ${
                          errors.location ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-blush/60 focus:border-plum focus:ring-4 focus:ring-plum/5'
                        }`}
                      />
                      <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={isLocating}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mauve bg-[#f9eaf1] px-4 py-3 text-sm font-bold text-[#5b2b45] hover:bg-[#ead4dd] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      {isLocating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-mauve" />
                      ) : (
                        <Navigation className="h-4 w-4 text-mauve" />
                      )}
                      <span>Locate Me</span>
                    </button>
                  </div>
                  {errors.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.location}
                    </p>
                  )}
                  {mapError && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {mapError}
                    </p>
                  )}
                </div>

                {/* Map Preview frame */}
                <div className="overflow-hidden rounded-2xl border border-blush/40 bg-[#fffafc] shadow-inner">
                  <iframe
                    title="Google Maps location finder"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery || 'Atonsu, Kumasi, Ghana')}&z=14&output=embed`}
                    className="h-64 w-full border-0"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>

                <div className="flex justify-end">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery || 'Atonsu, Kumasi, Ghana')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-plum hover:text-mauve underline transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* STEP 4: CUSTOMER INFO */}
            <div className="group rounded-3xl border border-rose/30 bg-white p-6 shadow-soft transition-colors duration-300 hover:border-rose/50 md:p-8">
              <div className="mb-6 flex items-center gap-3.5 border-b border-blush/20 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fffafc] border border-blush/40 text-mauve shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-plum">4. Contact Information</h3>
                  <p className="text-xs text-gray-500">Provide details for receipt & appointment notifications</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-charcoal">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => {
                        setForm({ ...form, customerName: e.target.value });
                        if (errors.customerName) {
                          setErrors((prev) => ({ ...prev, customerName: null }));
                        }
                      }}
                      placeholder="e.g. Ama Serwaa"
                      className={`w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm text-charcoal outline-none transition-all ${
                        errors.customerName ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-blush/60 focus:border-plum focus:ring-4 focus:ring-plum/5'
                      }`}
                    />
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.customerName && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-charcoal">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        setForm({ ...form, phone: e.target.value });
                        if (errors.phone) {
                          setErrors((prev) => ({ ...prev, phone: null }));
                        }
                      }}
                      placeholder="e.g. +233 24 123 4567"
                      className={`w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm text-charcoal outline-none transition-all ${
                        errors.phone ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-blush/60 focus:border-plum focus:ring-4 focus:ring-plum/5'
                      }`}
                    />
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.phone && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-charcoal">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: null }));
                        }
                      }}
                      placeholder="e.g. ama@example.com"
                      className={`w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm text-charcoal outline-none transition-all ${
                        errors.email ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-blush/60 focus:border-plum focus:ring-4 focus:ring-plum/5'
                      }`}
                    />
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-charcoal">Special Notes (Optional)</label>
                  <div className="relative">
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Specify requested extensions, preferred hair colors, styling requests, etc..."
                      className="w-full rounded-xl border border-blush/60 bg-white pl-10 pr-4 py-3 text-sm text-charcoal outline-none focus:border-plum focus:ring-4 focus:ring-plum/5 transition-all min-h-[110px]"
                    />
                    <FileText className="absolute left-3.5 top-4.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: STICKY BOOKING SUMMARY ── */}
          <div className="lg:col-span-1">
            <aside className="sticky top-6 rounded-3xl border border-rose/30 bg-white p-6 shadow-soft transition-all duration-300 hover:border-rose/50 flex flex-col gap-6">
              
              {/* Service image preview */}
              <div className="group relative h-48 overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={selectedService?.images?.[0] || SERVICE_FALLBACK_IMAGES[0]}
                  alt={selectedService?.name || "EL'S BRAIDS booking"}
                  className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h4 className="text-base font-bold drop-shadow leading-tight">
                    {selectedService?.name || 'Braiding Salon Booking'}
                  </h4>
                  <p className="text-xs text-[#f8dbe8] mt-0.5">EL'S BRAIDS BEAUTY</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-plum border-b border-blush/20 pb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-mauve" /> Booking Details
                </h3>
                
                <div className="mt-4 space-y-3.5 text-sm text-charcoal">
                  
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                      <Sparkles className="h-4 w-4 text-mauve" /> Service:
                    </span>
                    <span className="font-semibold text-plum text-right">
                      {selectedService?.name || 'Not selected'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                      <Calendar className="h-4 w-4 text-mauve" /> Date:
                    </span>
                    <span className="font-semibold text-plum text-right">
                      {form.date || 'Not selected'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                      <Clock className="h-4 w-4 text-mauve" /> Time Slot:
                    </span>
                    <span className="font-semibold text-plum text-right">
                      {form.time || 'Not selected'}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                      <MapPin className="h-4 w-4 text-mauve" /> Location:
                    </span>
                    <span className="font-semibold text-plum text-right text-xs max-w-[180px] truncate-3-lines leading-snug">
                      {form.googleLocation || form.location || mapQuery || 'Atonsu, Kumasi, Ghana'}
                    </span>
                  </div>

                  {/* Payment option */}
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                      <Lock className="h-4 w-4 text-mauve" /> Plan:
                    </span>
                    <span className="font-semibold text-plum text-right">
                      {form.paymentOption === 'half' ? '50% Deposit Due' : 'Full Payment Due'}
                    </span>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="border-t border-dashed border-blush/40 pt-4 mt-4 space-y-2">
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Styling Fee:</span>
                      <span>GHC {totalServicePrice.toFixed(2)}</span>
                    </div>

                    {form.paymentOption === 'half' && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Paid Today (Deposit):</span>
                        <span>GHC {depositPrice.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-blush/20 pt-2 text-base font-bold text-plum">
                      <span>Due Today:</span>
                      <span>GHC {totalDueToday.toFixed(2)}</span>
                    </div>

                    {form.paymentOption === 'half' && (
                      <div className="rounded-lg bg-cream/70 p-2 text-center text-[10px] font-semibold text-charcoal/80 leading-normal border border-blush/30">
                        Remaining balance of GHC {remainingBalance.toFixed(2)} payable at the salon.
                      </div>
                    )}

                  </div>

                </div>
              </div>

              {/* Checkout trigger button */}
              <div className="mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !isPaystackReady}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-plum py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-mauve hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>PROCESSING PAYMENT...</span>
                    </>
                  ) : !isPaystackReady ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>LOADING GATEWAY...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4.5 w-4.5 text-rose" />
                      <span>PAY GHC {totalDueToday.toFixed(2)}</span>
                    </>
                  )}
                </button>
                
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                  <Lock className="h-3 w-3 text-gray-400" />
                  <span>Secure transactions encrypted via Paystack</span>
                </div>
              </div>

            </aside>
          </div>

        </form>
      </div>
    </div>
  );
}

export default BookingPage;
