import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  MessageSquare,
  Package,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { handleImageError, optimizeImageUrl } from "../utils/image";

const uniqueCatalogItems = (items, key) => {
  const seen = new Set();
  return items.filter((item) => {
    const value = String(item[key] || "").trim().toLowerCase();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function AdminDashboardPage() {
  const [searchParams] = useSearchParams();
  const authConfig = () => {
    const token = sessionStorage.getItem("elsAdminToken");
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  };

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    todaysBookings: 0,
    todaysRevenue: 0,
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    revenue: 0,
    unreadMessages: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [messages, setMessages] = useState([]);
  const [settings, setSettings] = useState({});
  const [styleFormOpen, setStyleFormOpen] = useState(false);
  const [editingStyleId, setEditingStyleId] = useState(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [styleForm, setStyleForm] = useState({
    name: "",
    description: "",
    category: "Braids",
    price: "",
    duration: "",
    images: [],
    isActive: true,
    featured: false,
  });
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    category: "Braids",
    description: "",
    image: "",
  });
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    category: "Hair Care",
    price: "",
    stock: "",
    images: [],
    isActive: true,
  });
  const [galleryUploadOpen, setGalleryUploadOpen] = useState(false);
  const [websiteForm, setWebsiteForm] = useState({
    businessName: "",
    phone: "",
    email: "",
    location: "",
    googleMapsUrl: "",
    googleMapsEmbedUrl: "",
    businessHours: "",
    homepageText: "",
    aboutText: "",
    logo: "",
    favicon: "",
    heroImages: [],
    socials: { instagram: "", facebook: "", whatsapp: "", tiktok: "", snapchat: "" },
  });
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [activeView, setActiveView] = useState(
    searchParams.get("view") || "overview",
  );
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [bookingEditor, setBookingEditor] = useState({
    date: "",
    time: "",
    location: "",
    notes: "",
    status: "Pending",
  });

  useEffect(() => {
    console.log("[settings] Admin render image fields", {
      logo: websiteForm.logo,
      favicon: websiteForm.favicon,
      heroImages: websiteForm.heroImages,
    });
  }, [websiteForm.logo, websiteForm.favicon, websiteForm.heroImages]);

  useEffect(() => {
    if (document.querySelector('script[src="https://upload-widget.cloudinary.com/global/all.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await axios.put(
        `/api/admin/bookings/${bookingId}`,
        { status },
        authConfig(),
      );
      setRecentBookings((bookings) =>
        bookings.map((booking) =>
          booking.id === bookingId ? response.data.data : booking,
        ),
      );
      setAllBookings((bookings) =>
        bookings.map((booking) =>
          booking.id === bookingId ? response.data.data : booking,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("Unable to update booking status. Please try again.");
    }
  };

  const updateOrderStatus = async (orderId, changes) => {
    try {
      const response = await axios.put(
        `/api/admin/orders/${orderId}`,
        changes,
        authConfig(),
      );
      setRecentOrders((orders) =>
        orders.map((order) =>
          order.id === orderId ? response.data.data : order,
        ),
      );
      setAllOrders((orders) =>
        orders.map((order) =>
          order.id === orderId ? response.data.data : order,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("Unable to update order status. Please try again.");
    }
  };

  const deleteAdminMessage = async (messageId) => {
    if (!window.confirm("Delete this message? This action cannot be undone.")) return;

    try {
      await axios.delete(`/api/admin/messages/${messageId}`, authConfig());
      setMessages((items) => items.filter((message) => message.id !== messageId));
    } catch (error) {
      console.error(error);
      alert("Unable to delete this message. Please try again.");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setActiveView(searchParams.get("view") || "overview");
  }, [searchParams]);

  const loadDashboard = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axios.get("/api/admin/dashboard", authConfig());
      const [
        bookingsRes,
        ordersRes,
        servicesRes,
        productsRes,
        customersRes,
        galleryRes,
        messagesRes,
        settingsRes,
      ] = await Promise.all([
        axios.get("/api/admin/bookings", authConfig()),
        axios.get("/api/admin/orders", authConfig()),
        axios.get("/api/admin/services", authConfig()),
        axios.get("/api/admin/products", authConfig()),
        axios.get("/api/admin/customers", authConfig()),
        axios.get("/api/admin/gallery", authConfig()),
        axios.get("/api/admin/messages", authConfig()),
        axios.get("/api/admin/settings", authConfig()),
      ]);
      setStats(res.data.data.stats);
      setRecentBookings(res.data.data.recentBookings || []);
      setRecentOrders(res.data.data.recentOrders || []);
      setAllBookings(bookingsRes.data.data || []);
      setAllOrders(ordersRes.data.data || []);
      setServices(uniqueCatalogItems(servicesRes.data.data || [], "name"));
      const loadedProducts = productsRes.data.data || [];
      const productsBySku = uniqueCatalogItems(loadedProducts, "sku");
      setProducts(uniqueCatalogItems(productsBySku, "name"));
      setCustomers(customersRes.data.data || []);
      setGallery(galleryRes.data.data || []);
      setMessages(messagesRes.data.data || []);
      const loadedSettings = settingsRes.data.data || {};
      setSettings(loadedSettings);
      setWebsiteForm({
        businessName: loadedSettings.businessName || "",
        phone: loadedSettings.phone || "",
        email: loadedSettings.email || "",
        location: String(loadedSettings.location || "").replace(
          /Atomsu/gi,
          "Atonsu",
        ),
        googleMapsUrl: loadedSettings.googleMapsUrl || "",
        googleMapsEmbedUrl: loadedSettings.googleMapsEmbedUrl || "",
        businessHours: loadedSettings.businessHours || "",
        homepageText: loadedSettings.homepageText || "",
        aboutText: loadedSettings.aboutText || "",
        logo: loadedSettings.logo || "",
        favicon: loadedSettings.favicon || "",
        heroImages: loadedSettings.heroImages || [],
        socials: {
          instagram: loadedSettings.socials?.instagram || "",
          facebook: loadedSettings.socials?.facebook || "",
          whatsapp: loadedSettings.socials?.whatsapp || "",
          tiktok: loadedSettings.socials?.tiktok || "",
          snapchat: loadedSettings.socials?.snapchat || "",
        },
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load the latest dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const bookingTrend = useMemo(() => {
    const days =
      period === "today"
        ? 1
        : period === "week"
          ? 7
          : period === "year"
            ? 12
            : 30;
    const labels = [];
    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date();
      if (period === "year") date.setMonth(date.getMonth() - index);
      else date.setDate(date.getDate() - index);
      const key =
        period === "year"
          ? date.toISOString().slice(0, 7)
          : date.toISOString().slice(0, 10);
      labels.push({
        key,
        label:
          period === "year"
            ? date.toLocaleDateString("en", { month: "short" })
            : date.toLocaleDateString("en", { day: "numeric", month: "short" }),
      });
    }
    return labels.map(({ key, label }) => ({
      label,
      bookings: allBookings.filter(
        (booking) =>
          String(booking.date || "").slice(0, period === "year" ? 7 : 10) ===
          key,
      ).length,
      revenue: allOrders
        .filter(
          (order) =>
            String(order.createdAt || "").slice(
              0,
              period === "year" ? 7 : 10,
            ) === key,
        )
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
    }));
  }, [allBookings, allOrders, period]);

  const popularStyles = useMemo(() => {
    const counts = allBookings.reduce((result, booking) => {
      result[booking.serviceName] = (result[booking.serviceName] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts)
      .map(([name, bookings]) => ({ name, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  }, [allBookings]);

  const statusData = useMemo(
    () =>
      ["Pending", "Confirmed", "Completed", "Cancelled"]
        .map((status) => ({
          name: status,
          value: allBookings.filter((booking) => booking.status === status)
            .length,
        }))
        .filter((item) => item.value > 0),
    [allBookings],
  );

  const chartColors = ["#5b2b45", "#b36a86", "#df9db5", "#e7c0ce"];
  const mapLink = (booking) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.googleLocation || booking.location || "Atonsu, Kumasi, Ghana")}`;
  const orderMapLink = (order) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.googleLocation || order.address || `${order.city}, ${order.region}`)}`;
  const paymentStatusClasses = {
    Paid: "bg-green-100 text-green-700",
    Pending: "bg-amber-100 text-amber-700",
    Failed: "bg-red-100 text-red-700",
  };
  const bookingStatusClasses = {
    Pending: "bg-amber-100 text-amber-700",
    Confirmed: "bg-sky-100 text-sky-700",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };
  const formatMoney = (value) =>
    `GHS ${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const openEditBooking = (booking) => {
    setEditingBookingId(booking.id);
    setBookingEditor({
      date: booking.date || "",
      time: booking.time || "",
      location: booking.location || booking.googleLocation || "",
      notes: booking.notes || "",
      status: booking.status || "Pending",
    });
  };

  const saveBookingEdit = async () => {
    if (!editingBookingId) return;
    try {
      const response = await axios.put(
        `/api/admin/bookings/${editingBookingId}`,
        {
          date: bookingEditor.date,
          time: bookingEditor.time,
          location: bookingEditor.location,
          googleLocation: bookingEditor.location,
          notes: bookingEditor.notes,
          status: bookingEditor.status,
        },
        authConfig(),
      );
      const updatedBooking = response.data.data;
      setAllBookings((bookings) =>
        bookings.map((booking) =>
          booking.id === editingBookingId ? updatedBooking : booking,
        ),
      );
      setRecentBookings((bookings) =>
        bookings.map((booking) =>
          booking.id === editingBookingId ? updatedBooking : booking,
        ),
      );
      setEditingBookingId(null);
    } catch (error) {
      console.error(error);
      alert("Unable to update this booking. Please try again.");
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Delete this booking? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/admin/bookings/${bookingId}`, authConfig());
      setAllBookings((bookings) =>
        bookings.filter((booking) => booking.id !== bookingId),
      );
      setRecentBookings((bookings) =>
        bookings.filter((booking) => booking.id !== bookingId),
      );
      if (editingBookingId === bookingId) {
        setEditingBookingId(null);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to delete this booking. Please try again.");
    }
  };

  const openNewStyleForm = () => {
    setEditingStyleId(null);
    setStyleForm({
      name: "",
      description: "",
      category: "Braids",
      price: "",
      duration: "",
      images: [],
      isActive: true,
      featured: false,
    });
    setStyleFormOpen(true);
  };

  const openEditStyleForm = (style) => {
    setEditingStyleId(style.id);
    setStyleForm({
      name: style.name || "",
      description: style.description || "",
      category: style.category || "Braids",
      price: style.price || "",
      duration: style.duration || "",
      images: style.images || [],
      isActive: style.isActive !== false,
      featured: style.featured === true,
    });
    setStyleFormOpen(true);
  };

  const saveStyle = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...styleForm, price: Number(styleForm.price || 0) };
      const response = editingStyleId
        ? await axios.put(
            `/api/admin/services/${editingStyleId}`,
            payload,
            authConfig(),
          )
        : await axios.post("/api/admin/services", payload, authConfig());
      setServices((items) =>
        editingStyleId
          ? items.map((item) =>
              item.id === editingStyleId ? response.data.data : item,
            )
          : [response.data.data, ...items],
      );
      setStyleFormOpen(false);
    } catch (error) {
      console.error(error);
      alert("Unable to save this braid style. Please try again.");
    }
  };

  const openNewProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      name: "",
      sku: "",
      description: "",
      category: "Hair Care",
      price: "",
      stock: "",
      images: [],
      isActive: true,
    });
    setProductFormOpen(true);
  };

  const openEditProductForm = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      category: product.category || "Hair Care",
      price: product.price || "",
      stock: product.stock || "",
      images: product.images || [],
      isActive: product.isActive !== false,
    });
    setProductFormOpen(true);
  };

  const handleProductImages = async (event) => {
    const images = await readImages(event.target.files);
    setProductForm((form) => ({ ...form, images: [...form.images, ...images] }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...productForm,
        sku: productForm.sku.trim() || `SKU-${Date.now()}`,
        price: Number(productForm.price || 0),
        stock: Number(productForm.stock || 0),
      };
      const response = editingProductId
        ? await axios.put(`/api/admin/products/${editingProductId}`, payload, authConfig())
        : await axios.post("/api/admin/products", payload, authConfig());
      setProducts((items) =>
        editingProductId
          ? items.map((item) => item.id === editingProductId ? response.data.data : item)
          : [response.data.data, ...items],
      );
      setProductFormOpen(false);
    } catch (error) {
      console.error(error);
      alert("Unable to save this product. Please try again.");
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/products/${product.id}`, authConfig());
      setProducts((items) => items.filter((item) => item.id !== product.id));
    } catch (error) {
      console.error(error);
      alert("Unable to delete this product. Please try again.");
    }
  };

  const readImages = (files) =>
    Promise.all(Array.from(files).map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        image.onerror = reject;
        image.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));

  const handleStyleImages = async (event) => {
    const images = await readImages(event.target.files);
    setStyleForm((form) => ({ ...form, images: [...form.images, ...images] }));
  };

  const saveGalleryImage = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        "/api/admin/gallery",
        { ...galleryForm, isActive: true },
        authConfig(),
      );
      setGallery((items) => [response.data.data, ...items]);
      setGalleryForm({
        title: "",
        category: "Braids",
        description: "",
        image: "",
      });
      setGalleryUploadOpen(false);
    } catch (error) {
      console.error(error);
      alert("Unable to upload this photo. Please try again.");
    }
  };

  const handleGalleryImage = async (event) => {
    const [image] = await readImages(event.target.files);
    setGalleryForm((form) => ({ ...form, image }));
  };

  const deleteStyle = async (style) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${style.name}? This action cannot be undone.`,
      )
    )
      return;
    try {
      await axios.delete(`/api/admin/services/${style.id}`, authConfig());
      setServices((items) => items.filter((item) => item.id !== style.id));
    } catch (error) {
      console.error(error);
      alert("Unable to delete this braid style. Please try again.");
    }
  };

  const saveWebsite = async (event) => {
    event.preventDefault();
    setSavingWebsite(true);
    const payload = {
      ...websiteForm,
      location: websiteForm.location.replace(/Atomsu/gi, "Atonsu"),
      socials: websiteForm.socials,
    };
    console.log("[settings] Sending PUT /api/admin/settings", {
      imageFields: {
        logo: payload.logo,
        favicon: payload.favicon,
        heroImages: payload.heroImages,
      },
    });
    try {
      const response = await axios.put(
        "/api/admin/settings",
        payload,
        authConfig(),
      );
      console.log("[settings] PUT response received", response.data.data);
      setSettings(response.data.data);
      setWebsiteForm((form) => ({
        ...form,
        logo: response.data.data?.logo || form.logo,
        favicon: response.data.data?.favicon || form.favicon,
        heroImages: response.data.data?.heroImages || form.heroImages,
        location: String(response.data.data.location || "").replace(
          /Atomsu/gi,
          "Atonsu",
        ),
      }));
      alert("Website changes published successfully.");
    } catch (error) {
      console.error(error);
      alert("Unable to save website changes. Please try again.");
    } finally {
      setSavingWebsite(false);
    }
  };

  const mapCoordinateMatch = websiteForm.googleMapsUrl?.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const adminMapQuery = mapCoordinateMatch
    ? `${mapCoordinateMatch[1]},${mapCoordinateMatch[2]}`
    : websiteForm.location || "Atonsu, Kumasi, Ghana";

  const useCurrentMapLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const url = `https://www.google.com/maps/@${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)},17z`;
        setWebsiteForm((form) => ({ ...form, googleMapsUrl: url }));
      },
      () => alert("Unable to access your current location. Please allow location access or enter a map link manually."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const openCloudinaryUpload = (field, multiple = false) => {
    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      alert("Cloudinary upload is not configured.");
      return;
    }
    if (!window.cloudinary?.openUploadWidget) {
      alert("Cloudinary is still loading. Please try again in a moment.");
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: cloudinaryCloudName,
        uploadPreset: cloudinaryUploadPreset,
        sources: ["local", "url"],
        multiple,
        maxFiles: multiple ? 10 : 1,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "svg"],
        folder: "els-braids",
      },
      (error, result) => {
        if (error) {
          console.error(error);
          alert("Unable to upload image to Cloudinary.");
          return;
        }
        if (result.event !== "success") return;
        const secureUrl = result.info?.secure_url;
        if (!secureUrl || !secureUrl.startsWith("https://res.cloudinary.com/")) {
          console.error("[cloudinary] Invalid secure_url", result.info);
          alert("Cloudinary returned an invalid image URL.");
          return;
        }
        console.log("[cloudinary] secure_url received", secureUrl);
        setWebsiteForm((form) => {
          const nextForm = {
          ...form,
          [field]: field === "heroImages"
            ? [...form.heroImages, secureUrl]
            : secureUrl,
          };
          console.log("[settings] Image state updated", {
            field,
            logo: nextForm.logo,
            favicon: nextForm.favicon,
            heroImages: nextForm.heroImages,
          });
          return nextForm;
        });
      },
    );
  };

  const removeWebsiteImage = (field, imageIndex = null) => {
    setWebsiteForm((form) => ({
      ...form,
      [field]: field === "heroImages"
        ? form.heroImages.filter((_, index) => index !== imageIndex)
        : "",
    }));
  };

  const uploadBookingImage = async (bookingId, field) => {
    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      alert("Cloudinary upload is not configured.");
      return;
    }
    if (!window.cloudinary?.openUploadWidget) {
      alert("Cloudinary is still loading. Please try again in a moment.");
      return;
    }

    console.log("[booking-images] opening Cloudinary upload", { bookingId, field });
    window.cloudinary.openUploadWidget(
      {
        cloudName: cloudinaryCloudName,
        uploadPreset: cloudinaryUploadPreset,
        sources: ["local", "url"],
        multiple: false,
        maxFiles: 1,
        folder: "els-braids/bookings",
      },
      async (error, result) => {
        if (error) {
          console.error("[booking-images] Cloudinary upload error", error);
          alert("Unable to upload booking image to Cloudinary.");
          return;
        }

        const secureUrl = result?.event === "success" ? result.info?.secure_url : null;
        if (!secureUrl || !secureUrl.startsWith("https://res.cloudinary.com/")) {
          console.error("[booking-images] invalid secure_url", result);
          alert("Cloudinary returned an invalid booking image URL.");
          return;
        }

        console.log("[booking-images] secure_url received", { bookingId, field, secureUrl });

        try {
          const response = await axios.put(
            `/api/admin/bookings/${bookingId}`,
            { [field]: secureUrl },
            authConfig(),
          );

          const savedBooking = response.data.data;
          console.log("[booking-images] booking image saved", { bookingId, field, savedBooking });

          setAllBookings((bookings) => bookings.map((booking) => (booking.id === bookingId ? { ...booking, ...savedBooking } : booking)));
          setRecentBookings((bookings) => bookings.map((booking) => (booking.id === bookingId ? { ...booking, ...savedBooking } : booking)));
        } catch (uploadError) {
          console.error("[booking-images] failed to persist booking image", uploadError);
          alert("Booking image upload succeeded, but saving to the booking failed.");
        }
      },
    );
  };

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {activeView === "bookings" && (
        <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black uppercase text-[#5b2b45]">
              All Bookings
            </h2>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a3855]">
              {allBookings.length} total
            </span>
          </div>

          <div className="space-y-4">
            {allBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-[#ead4dd] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-[#f0e1e7] pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-black text-[#5b2b45]">
                      {booking.customerName}
                    </div>
                    <div className="text-sm text-[#5f4253]">
                      {booking.serviceName}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditBooking(booking)}
                      className="rounded-md border border-[#d9b2c2] bg-[#fdf3f7] px-3 py-1.5 text-xs font-semibold text-[#5b2b45]"
                    >
                      Edit booking
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBooking(booking.id)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                    <a
                      href={mapLink(booking)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-[#d9b2c2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5b2b45]"
                    >
                      <ExternalLink size={12} /> View map
                    </a>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <div className="rounded-xl bg-[#fff8fb] p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a3855]">
                      Customer contact
                    </div>
                    <div className="space-y-2 text-sm text-[#5f4253]">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Name
                        </span>
                        <span className="font-semibold text-[#5b2b45]">
                          {booking.customerName}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Phone
                        </span>
                        <span>{booking.phone || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Email
                        </span>
                        <span>{booking.email || "Not provided"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#fff8fb] p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a3855]">
                      Booking details
                    </div>
                    <div className="space-y-2 text-sm text-[#5f4253]">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Service
                        </span>
                        <span className="font-semibold text-[#5b2b45]">
                          {booking.serviceName}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Date & time
                        </span>
                        <span>
                          {booking.date} {booking.time}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Location
                        </span>
                        <span>{booking.location || "Atonsu, Kumasi, Ghana"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#fff8fb] p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a3855]">
                      Payment status
                    </div>
                    <div className="space-y-2 text-sm text-[#5f4253]">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Plan
                        </span>
                        <span className="font-semibold text-[#5b2b45]">
                          {booking.paymentOption === "half" ? "50% deposit" : "Full payment"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Amount paid
                        </span>
                        <span>{formatMoney(booking.paymentAmount || 0)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Reference
                        </span>
                        <span>{booking.reference || "Not available"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#7a3855]">
                          Status
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${paymentStatusClasses[booking.paymentStatus] || "bg-slate-100 text-slate-700"}`}
                        >
                          {booking.paymentStatus || "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#faf3f7] p-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a3855]">
                      Booking status
                    </span>
                    <select
                      value={booking.status || "Pending"}
                      onChange={(event) =>
                        updateBookingStatus(booking.id, event.target.value)
                      }
                      className="rounded-md border border-[#ead4dd] bg-white px-2 py-1 text-xs font-semibold text-[#5b2b45]"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${bookingStatusClasses[booking.status] || "bg-slate-100 text-slate-700"}`}
                  >
                    {booking.status || "Pending"}
                  </span>
                </div>

                {editingBookingId === booking.id && (
                  <div className="mt-4 rounded-xl border border-[#ead4dd] bg-[#fffafc] p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#7a3855]">
                      Edit booking
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-[#5b2b45]">
                        Date
                        <input
                          type="date"
                          value={bookingEditor.date}
                          onChange={(event) =>
                            setBookingEditor((prev) => ({
                              ...prev,
                              date: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-[#ead4dd] bg-white px-3 py-2 text-sm text-[#5f4253]"
                        />
                      </label>

                      <label className="text-xs font-semibold text-[#5b2b45]">
                        Time
                        <input
                          type="time"
                          value={bookingEditor.time}
                          onChange={(event) =>
                            setBookingEditor((prev) => ({
                              ...prev,
                              time: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-[#ead4dd] bg-white px-3 py-2 text-sm text-[#5f4253]"
                        />
                      </label>

                      <label className="text-xs font-semibold text-[#5b2b45] md:col-span-2">
                        Location
                        <input
                          type="text"
                          value={bookingEditor.location}
                          onChange={(event) =>
                            setBookingEditor((prev) => ({
                              ...prev,
                              location: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-[#ead4dd] bg-white px-3 py-2 text-sm text-[#5f4253]"
                        />
                      </label>

                      <label className="text-xs font-semibold text-[#5b2b45] md:col-span-2">
                        Notes
                        <textarea
                          value={bookingEditor.notes}
                          onChange={(event) =>
                            setBookingEditor((prev) => ({
                              ...prev,
                              notes: event.target.value,
                            }))
                          }
                          rows={3}
                          className="mt-1 w-full rounded-md border border-[#ead4dd] bg-white px-3 py-2 text-sm text-[#5f4253]"
                        />
                      </label>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBookingId(null)}
                        className="rounded-md border border-[#ead4dd] bg-white px-3 py-1.5 text-xs font-semibold text-[#5b2b45]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveBookingEdit}
                        className="rounded-md bg-[#5b2b45] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {activeView === "orders" && (
        <div className="overflow-x-auto rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-black uppercase text-[#5b2b45]">
            All Orders
          </h2>
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-[#ead4dd] text-xs uppercase tracking-[0.14em] text-[#7a3855]">
              <tr>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Delivery details</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Fulfillment</th>
                <th className="pb-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#f0e1e7] last:border-0"
                >
                  <td className="py-4 font-semibold text-[#5b2b45]">
                    {order.customerName}
                    <span className="block text-xs font-normal text-[#5f4253]">
                      {order.email}
                    </span>
                  </td>
                  <td className="py-4 text-[#5f4253]">
                    <div className="space-y-1">
                      {(order.items || []).map((item, index) => (
                        <div key={`${item.name}-${index}`} className="font-medium text-[#5b2b45]">
                          {item.name} <span className="font-normal text-[#7a3855]">× {item.quantity}</span>
                          <span className="block text-xs font-normal text-[#7a3855]">GHC {Number(item.price || 0) * Number(item.quantity || 0)}</span>
                        </div>
                      ))}
                      {!order.items?.length && <span>No products listed</span>}
                    </div>
                  </td>
                  <td className="py-4 text-[#5f4253]">
                    <div className="font-semibold text-[#5b2b45]">{order.deliveryLocation || "Delivery method not provided"}</div>
                    <div>{order.address || "Address not provided"}</div>
                    {order.googleLocation && order.googleLocation !== order.address && <div>Map: {order.googleLocation}</div>}
                    <div>{order.city || "City not provided"}, {order.region || "Region not provided"}</div>
                    <div className="text-xs">{order.phone || "Phone not provided"}</div>
                    <a href={orderMapLink(order)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-[#7a3855] underline"><ExternalLink size={12} /> Open map</a>
                    {order.notes && <div className="mt-1 text-xs italic">Note: {order.notes}</div>}
                  </td>
                  <td className="py-4 font-semibold text-[#5b2b45]">
                    GHC {Number(order.total || 0)}
                  </td>
                  <td className="py-4">
                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateOrderStatus(order.id, {
                          status: event.target.value,
                        })
                      }
                      className="rounded-md border border-[#ead4dd] bg-white px-2 py-1 text-xs font-semibold text-[#5b2b45]"
                    >
                      <option>Pending</option>
                      <option>Processing</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                  <td className="py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        order.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-700"
                          : order.paymentStatus === "Failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}>
                        {order.paymentStatus || "Pending"}
                      </span>
                      <div className="text-xs text-[#5f4253]">
                        <div><span className="font-semibold text-[#5b2b45]">Method:</span> {order.paymentMethod || "Paystack"}</div>
                        <div><span className="font-semibold text-[#5b2b45]">Ref:</span> {order.paymentReference || "Not available"}</div>
                        <div><span className="font-semibold text-[#5b2b45]">Paid:</span> {order.paymentDate ? new Date(order.paymentDate).toLocaleString() : (order.updatedAt || order.createdAt ? new Date(order.updatedAt || order.createdAt).toLocaleString() : "Not recorded")}</div>
                      </div>
                      <select
                        value={order.paymentStatus || "Pending"}
                        onChange={(event) =>
                          updateOrderStatus(order.id, {
                            paymentStatus: event.target.value,
                          })
                        }
                        className="rounded-md border border-[#ead4dd] bg-white px-2 py-1 text-xs font-semibold text-[#5b2b45]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {activeView === "catalog" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {styleFormOpen && (
            <form
              onSubmit={saveStyle}
              className="lg:col-span-2 rounded-[1.75rem] border border-[#d9aec0] bg-[#fff2f6] p-6 shadow-soft"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase text-[#5b2b45]">
                    {editingStyleId
                      ? "Edit braid style"
                      : "Add new braid style"}
                  </h2>
                  <p className="mt-1 text-sm text-[#7a3855]">
                    Update the details customers see when they book.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStyleFormOpen(false)}
                  className="text-sm font-semibold text-[#7a3855] underline"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  required
                  placeholder="Style name"
                  value={styleForm.name}
                  onChange={(event) =>
                    setStyleForm({ ...styleForm, name: event.target.value })
                  }
                  className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3"
                />
                <input
                  required
                  placeholder="Category"
                  value={styleForm.category}
                  onChange={(event) =>
                    setStyleForm({ ...styleForm, category: event.target.value })
                  }
                  className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3"
                />
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Price (GHS)"
                  value={styleForm.price}
                  onChange={(event) =>
                    setStyleForm({ ...styleForm, price: event.target.value })
                  }
                  className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3"
                />
                <input
                  required
                  placeholder="Estimated time"
                  value={styleForm.duration}
                  onChange={(event) =>
                    setStyleForm({ ...styleForm, duration: event.target.value })
                  }
                  className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3"
                />
                <textarea
                  required
                  placeholder="Description"
                  value={styleForm.description}
                  onChange={(event) =>
                    setStyleForm({
                      ...styleForm,
                      description: event.target.value,
                    })
                  }
                  className="min-h-24 rounded-lg border border-[#ead4dd] bg-white px-4 py-3 md:col-span-2"
                />
                <label className="rounded-lg border border-dashed border-[#c98fa7] bg-white p-4 text-sm font-semibold text-[#5b2b45] md:col-span-2">
                  Upload style photos (select multiple)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleStyleImages}
                    className="mt-2 block w-full text-sm font-normal"
                  />
                  {styleForm.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {styleForm.images.map((image, index) => (
                        <div key={`${image}-${index}`} className="relative">
                          <img
                            src={image}
                            alt={`Style preview ${index + 1}`}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setStyleForm((form) => ({
                                ...form,
                                images: form.images.filter(
                                  (_, imageIndex) => imageIndex !== index,
                                ),
                              }))
                            }
                            className="absolute -right-2 -top-2 rounded-full bg-[#5b2b45] px-1.5 text-xs text-white"
                            aria-label={`Remove style image ${index + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </label>
                <div className="flex flex-wrap gap-5 text-sm font-semibold text-[#5b2b45] md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={styleForm.isActive}
                      onChange={(event) =>
                        setStyleForm({
                          ...styleForm,
                          isActive: event.target.checked,
                        })
                      }
                    />{" "}
                    Show on website
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={styleForm.featured}
                      onChange={(event) =>
                        setStyleForm({
                          ...styleForm,
                          featured: event.target.checked,
                        })
                      }
                    />{" "}
                    Featured style
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="mt-5 rounded-full bg-[#5b2b45] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {editingStyleId ? "Save changes" : "Add style"}
              </button>
            </form>
          )}
          {productFormOpen && (
            <form
              onSubmit={saveProduct}
              className="lg:col-span-2 rounded-[1.75rem] border border-[#d9aec0] bg-[#fff2f6] p-6 shadow-soft"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase text-[#5b2b45]">
                    {editingProductId ? "Edit product" : "Add new product"}
                  </h2>
                  <p className="mt-1 text-sm text-[#7a3855]">Add the details and photos customers see in the shop.</p>
                </div>
                <button type="button" onClick={() => setProductFormOpen(false)} className="text-sm font-semibold text-[#7a3855] underline">Close</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input required placeholder="Product name" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
                <input placeholder="SKU (optional)" value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
                <input required placeholder="Category" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
                <input required type="number" min="0" step="0.01" placeholder="Price (GHS)" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
                <input required type="number" min="0" placeholder="Stock quantity" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} className="rounded-lg border border-[#ead4dd] bg-white px-4 py-3" />
                <textarea required placeholder="Description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} className="min-h-24 rounded-lg border border-[#ead4dd] bg-white px-4 py-3 md:col-span-2" />
                <label className="rounded-lg border border-dashed border-[#c98fa7] bg-white p-4 text-sm font-semibold text-[#5b2b45] md:col-span-2">
                  Upload product photos (select multiple)
                  <input type="file" accept="image/*" multiple onChange={handleProductImages} className="mt-2 block w-full text-sm font-normal" />
                  {productForm.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {productForm.images.map((image, index) => (
                        <div key={`${image}-${index}`} className="relative">
                          <img src={image} alt={`Product preview ${index + 1}`} className="h-16 w-16 rounded-md object-cover" />
                          <button type="button" onClick={() => setProductForm((form) => ({ ...form, images: form.images.filter((_, imageIndex) => imageIndex !== index) }))} className="absolute -right-2 -top-2 rounded-full bg-[#5b2b45] px-1.5 text-xs text-white" aria-label={`Remove product image ${index + 1}`}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#5b2b45] md:col-span-2">
                  <input type="checkbox" checked={productForm.isActive} onChange={(event) => setProductForm({ ...productForm, isActive: event.target.checked })} /> Show in shop
                </label>
              </div>
              <button type="submit" className="mt-5 rounded-full bg-[#5b2b45] px-5 py-2.5 text-sm font-semibold text-white">{editingProductId ? "Save changes" : "Add product"}</button>
            </form>
          )}
          <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
            <div className="mb-4">
              <h2 className="text-xl font-black uppercase text-[#5b2b45]">Categories</h2>
              <p className="mt-1 text-sm text-[#7a3855]">Categories are created from the products and styles you add.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...new Set([...services.map((item) => item.category), ...products.map((item) => item.category)].filter(Boolean))].map((category) => (
                <div key={category} className="rounded-xl border border-[#ead4dd] bg-white px-4 py-3">
                  <div className="font-semibold text-[#5b2b45]">{category}</div>
                  <div className="mt-1 text-xs text-[#7a3855]">{services.filter((item) => item.category === category).length} styles · {products.filter((item) => item.category === category).length} products</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase text-[#5b2b45]">Services</h2>
                <p className="mt-1 text-sm text-[#7a3855]">Manage the styles customers can book.</p>
              </div>
              <button type="button" onClick={openNewStyleForm} className="rounded-full bg-[#5b2b45] px-3 py-2 text-xs font-semibold text-white">+ Add style</button>
            </div>
            <div className="space-y-3">
              {services.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ead4dd] bg-white px-4 py-3">
                  <div><span className="font-semibold text-[#5b2b45]">{item.name}</span><span className={`ml-2 text-xs font-semibold ${item.isActive === false ? "text-red-600" : "text-green-700"}`}>{item.isActive === false ? "Hidden" : "Visible"}</span></div>
                  <div className="flex items-center gap-2"><span className="text-sm text-[#5f4253]">GHC {item.price}</span><button type="button" onClick={() => openEditStyleForm(item)} className="text-xs font-semibold text-[#7a3855] underline">Edit</button><button type="button" onClick={() => deleteStyle(item)} className="text-xs font-semibold text-red-700 underline">Delete</button></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-xl font-black uppercase text-[#5b2b45]">Products</h2><p className="mt-1 text-sm text-[#7a3855]">Keep your shop catalogue fresh.</p></div>
              <button type="button" onClick={openNewProductForm} className="rounded-full bg-[#5b2b45] px-3 py-2 text-xs font-semibold text-white">+ Add product</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-xl border border-[#ead4dd] bg-white">
                  {item.images?.[0] && <img src={optimizeImageUrl(item.images[0])} alt={item.name} onError={(event) => handleImageError(event)} loading="lazy" className="h-28 w-full object-cover" />}
                  <div className="p-3"><div className="flex items-start justify-between gap-2"><span className="font-semibold text-[#5b2b45]">{item.name}</span><span className={`shrink-0 text-xs font-semibold ${item.stock < 10 ? "text-amber-700" : "text-green-700"}`}>{item.stock} left</span></div><p className="mt-1 text-xs text-[#7a3855]">{item.category} · GHC {item.price}</p><p className="mt-2 line-clamp-2 text-sm leading-5 text-[#5f4253]">{item.description || "No description added."}</p><div className="mt-3 flex gap-3"><button type="button" onClick={() => openEditProductForm(item)} className="text-xs font-semibold text-[#7a3855] underline">Edit</button><button type="button" onClick={() => deleteProduct(item)} className="text-xs font-semibold text-red-700 underline">Delete</button></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeView === "customers" && (
        <div className="overflow-x-auto rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-black uppercase text-[#5b2b45]">
            Customers
          </h2>
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-[#ead4dd] text-xs uppercase tracking-[0.14em] text-[#7a3855]">
              <tr>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Bookings</th>
                <th className="pb-3">Orders</th>
                <th className="pb-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-[#f0e1e7] last:border-0"
                >
                  <td className="py-4 font-semibold text-[#5b2b45]">
                    {customer.name}
                  </td>
                  <td className="py-4 text-[#5f4253]">
                    {customer.email}
                    <span className="block text-xs">{customer.phone}</span>
                  </td>
                  <td className="py-4 text-[#5f4253]">
                    {customer.bookings || 0}
                  </td>
                  <td className="py-4 text-[#5f4253]">
                    {customer.orders || 0}
                  </td>
                  <td className="py-4 text-[#5f4253]">
                    {customer.registeredAt
                      ? new Date(customer.registeredAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {activeView === "gallery" && (
        <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase text-[#5b2b45]">
                Gallery manager
              </h2>
              <span className="text-sm text-[#7a3855]">
                {gallery.length} published image(s)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGalleryUploadOpen((open) => !open)}
              className="rounded-full bg-[#5b2b45] px-4 py-2 text-sm font-semibold text-white"
            >
              + Add photo
            </button>
          </div>
          {galleryUploadOpen && (
            <form
              onSubmit={saveGalleryImage}
              className="mb-6 grid gap-3 rounded-xl border border-[#d9aec0] bg-[#fff2f6] p-4 md:grid-cols-2"
            >
              <input
                required
                placeholder="Photo title"
                value={galleryForm.title}
                onChange={(event) =>
                  setGalleryForm({ ...galleryForm, title: event.target.value })
                }
                className="rounded-lg border border-[#ead4dd] bg-white px-3 py-2"
              />
              <input
                placeholder="Category"
                value={galleryForm.category}
                onChange={(event) =>
                  setGalleryForm({
                    ...galleryForm,
                    category: event.target.value,
                  })
                }
                className="rounded-lg border border-[#ead4dd] bg-white px-3 py-2"
              />
              <textarea
                placeholder="Description"
                value={galleryForm.description}
                onChange={(event) =>
                  setGalleryForm({
                    ...galleryForm,
                    description: event.target.value,
                  })
                }
                className="rounded-lg border border-[#ead4dd] bg-white px-3 py-2 md:col-span-2"
              />
              <label className="rounded-lg border border-dashed border-[#c98fa7] bg-white p-3 text-sm font-semibold text-[#5b2b45] md:col-span-2">
                Choose photo
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryImage}
                  className="mt-2 block w-full text-sm font-normal"
                />
                {galleryForm.image && (
                  <img
                    src={galleryForm.image}
                    alt="Gallery preview"
                    className="mt-3 h-24 w-24 rounded-md object-cover"
                  />
                )}
              </label>
              <button
                type="submit"
                className="w-fit rounded-full bg-[#5b2b45] px-4 py-2 text-sm font-semibold text-white"
              >
                Upload photo
              </button>
            </form>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-[#ead4dd] bg-white"
              >
                <img
                  src={optimizeImageUrl(item.image)}
                  alt={item.title}
                  onError={(event) => handleImageError(event)}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
                <div className="p-3">
                  <div className="font-semibold text-[#5b2b45]">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs text-[#7a3855]">
                    {item.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeView === "messages" && (
        <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase text-[#5b2b45]">
              Messages
            </h2>
            <span className="text-sm text-[#7a3855]">
              {messages.filter((message) => !message.read).length} unread
            </span>
          </div>
          <div className="space-y-3">
            {messages.length ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl border p-4 ${message.read ? "border-[#ead4dd] bg-white" : "border-[#d9aec0] bg-[#fff2f6]"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-[#5b2b45]">
                      {message.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#7a3855]">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteAdminMessage(message.id)}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-[#5f4253]">
                    {message.email} · {message.phone}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#2b1d22]">
                    {message.message}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#5f4253]">
                No customer messages yet.
              </p>
            )}
          </div>
        </div>
      )}
      {["reviews", "notifications", "settings"].includes(activeView) && (
        <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-8 shadow-soft">
          <h2 className="text-xl font-black uppercase text-[#5b2b45]">
            {activeView === "settings" ? "Edit website" : activeView}
          </h2>
          {activeView === "settings" ? (
            <form onSubmit={saveWebsite} className="mt-6 space-y-5">
              <p className="max-w-xl text-sm leading-6 text-[#5f4253]">
                Update the public website without editing code. Changes publish
                immediately.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Business name
                  <input
                    value={websiteForm.businessName}
                    onChange={(event) =>
                      setWebsiteForm({
                        ...websiteForm,
                        businessName: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Phone
                  <input
                    value={websiteForm.phone}
                    onChange={(event) =>
                      setWebsiteForm({
                        ...websiteForm,
                        phone: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Email
                  <input
                    type="email"
                    value={websiteForm.email}
                    onChange={(event) =>
                      setWebsiteForm({
                        ...websiteForm,
                        email: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Location
                  <input
                    value={websiteForm.location}
                    onChange={(event) =>
                      setWebsiteForm({
                        ...websiteForm,
                        location: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Google Maps link
                  <input type="url" value={websiteForm.googleMapsUrl} onChange={(event) => setWebsiteForm({ ...websiteForm, googleMapsUrl: event.target.value })} placeholder="https://maps.google.com/..." className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal" />
                  <button type="button" onClick={useCurrentMapLocation} className="mt-3 rounded-lg border border-[#7a3855] bg-[#f9eaf1] px-3 py-2 text-sm font-semibold text-[#5b2b45]">Use current location</button>
                  <iframe
                    title="Configured Google Maps location"
                    src={websiteForm.googleMapsEmbedUrl || (websiteForm.googleMapsUrl?.includes('/maps/embed')
                      ? websiteForm.googleMapsUrl
                      : `https://www.google.com/maps?q=${encodeURIComponent(adminMapQuery)}&z=14&output=embed`)}
                    className="mt-3 h-48 w-full rounded-lg border border-[#ead4dd]"
                    loading="lazy"
                    allowFullScreen
                  />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Opening hours
                  <input
                    value={websiteForm.businessHours}
                    onChange={(event) =>
                      setWebsiteForm({
                        ...websiteForm,
                        businessHours: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Homepage tagline
                  <input
                    value={websiteForm.homepageText}
                    onChange={(event) =>
                      setWebsiteForm({
                        ...websiteForm,
                        homepageText: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Instagram link
                  <input type="url" value={websiteForm.socials.instagram} onChange={(event) => setWebsiteForm({ ...websiteForm, socials: { ...websiteForm.socials, instagram: event.target.value } })} placeholder="https://instagram.com/..." className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Facebook link
                  <input type="url" value={websiteForm.socials.facebook} onChange={(event) => setWebsiteForm({ ...websiteForm, socials: { ...websiteForm.socials, facebook: event.target.value } })} placeholder="https://facebook.com/..." className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  WhatsApp link
                  <input type="url" value={websiteForm.socials.whatsapp} onChange={(event) => setWebsiteForm({ ...websiteForm, socials: { ...websiteForm.socials, whatsapp: event.target.value } })} placeholder="https://wa.me/..." className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  TikTok link
                  <input type="url" value={websiteForm.socials.tiktok} onChange={(event) => setWebsiteForm({ ...websiteForm, socials: { ...websiteForm.socials, tiktok: event.target.value } })} placeholder="https://tiktok.com/@..." className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-[#5b2b45]">
                  Snapchat link
                  <input type="url" value={websiteForm.socials.snapchat} onChange={(event) => setWebsiteForm({ ...websiteForm, socials: { ...websiteForm.socials, snapchat: event.target.value } })} placeholder="https://snapchat.com/add/..." className="mt-2 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal" />
                </label>
                <label className="rounded-lg border border-dashed border-[#c98fa7] bg-white p-4 text-sm font-semibold text-[#5b2b45]">
                  Website logo
                  <button type="button" onClick={() => openCloudinaryUpload("logo")} className="mt-2 block rounded-lg bg-[#5b2b45] px-3 py-2 text-sm font-semibold text-white">Upload with Cloudinary</button>
                  {websiteForm.logo && (
                    <span className="relative mt-3 block w-fit">
                      <img src={optimizeImageUrl(websiteForm.logo)} alt="Logo preview" onError={(event) => handleImageError(event)} loading="lazy" className="h-16 w-16 rounded-full object-cover" />
                      <button type="button" onClick={() => removeWebsiteImage("logo")} className="absolute -right-2 -top-2 rounded-full bg-[#5b2b45] px-1.5 text-xs text-white" aria-label="Remove logo">×</button>
                    </span>
                  )}
                </label>
                <label className="rounded-lg border border-dashed border-[#c98fa7] bg-white p-4 text-sm font-semibold text-[#5b2b45]">
                  Favicon
                  <button type="button" onClick={() => openCloudinaryUpload("favicon")} className="mt-2 block rounded-lg bg-[#5b2b45] px-3 py-2 text-sm font-semibold text-white">Upload with Cloudinary</button>
                  {websiteForm.favicon && (
                    <span className="relative mt-3 block w-fit">
                      <img src={optimizeImageUrl(websiteForm.favicon)} alt="Favicon preview" onError={(event) => handleImageError(event)} loading="lazy" className="h-10 w-10 rounded-md object-cover" />
                      <button type="button" onClick={() => removeWebsiteImage("favicon")} className="absolute -right-2 -top-2 rounded-full bg-[#5b2b45] px-1.5 text-xs text-white" aria-label="Remove favicon">×</button>
                    </span>
                  )}
                </label>
                <label className="rounded-lg border border-dashed border-[#c98fa7] bg-white p-4 text-sm font-semibold text-[#5b2b45] md:col-span-2">
                  Hero slider images
                  <button type="button" onClick={() => openCloudinaryUpload("heroImages", true)} className="mt-2 block rounded-lg bg-[#5b2b45] px-3 py-2 text-sm font-semibold text-white">Upload with Cloudinary</button>
                  {websiteForm.heroImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {websiteForm.heroImages.map((image, index) => (
                        <span key={`${image}-${index}`} className="relative block">
                          <img src={optimizeImageUrl(image)} alt={`Hero preview ${index + 1}`} onError={(event) => handleImageError(event)} loading="lazy" className="h-20 w-full rounded-md object-cover" />
                          <button type="button" onClick={() => removeWebsiteImage("heroImages", index)} className="absolute -right-1 -top-2 rounded-full bg-[#5b2b45] px-1.5 text-xs text-white" aria-label={`Remove hero image ${index + 1}`}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </label>
                <label className="text-sm font-semibold text-[#5b2b45] md:col-span-2">
                  About text
                  <textarea
                    value={websiteForm.aboutText}
                    onChange={(event) =>
                      setWebsiteForm({
                        ...websiteForm,
                        aboutText: event.target.value,
                      })
                    }
                    className="mt-2 min-h-28 w-full rounded-lg border border-[#ead4dd] bg-white px-4 py-3 font-normal"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={savingWebsite}
                className="rounded-full bg-[#5b2b45] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingWebsite ? "Publishing..." : "Publish changes"}
              </button>
            </form>
          ) : (
            <>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f4253]">
                This workspace is ready for owner review tools and notification
                preferences.
              </p>
            </>
          )}
        </div>
      )}
      {activeView !== "overview" && <div />}
      {activeView === "overview" && (
        <>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveView("catalog")}
              className="rounded-full bg-[#5b2b45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#712f4b]"
            >
              + Add braid style
            </button>
            <button
              type="button"
              onClick={() => setActiveView("bookings")}
              className="rounded-full border border-[#7a3855] bg-white px-4 py-2.5 text-sm font-semibold text-[#5b2b45] transition hover:bg-[#f9eaf1]"
            >
              + New booking
            </button>
            <button
              type="button"
              onClick={() => setActiveView("gallery")}
              className="rounded-full border border-[#7a3855] bg-white px-4 py-2.5 text-sm font-semibold text-[#5b2b45] transition hover:bg-[#f9eaf1]"
            >
              Upload gallery
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Today's bookings", stats.todaysBookings, CalendarDays],
              ["Pending bookings", stats.pendingBookings, Clock3],
              ["Confirmed bookings", stats.confirmedBookings, CheckCircle2],
              ["Completed bookings", stats.completedBookings, Activity],
              ["Total customers", stats.totalCustomers, Users],
              ["Total braid styles", stats.totalProducts, Package],
              ["Revenue", `GHC ${stats.revenue}`, CircleDollarSign],
              ["Unread messages", stats.unreadMessages, MessageSquare],
            ].map(([label, value, Icon]) => (
              <div
                key={label}
                className="rounded-[1.5rem] border border-[#ead4dd] bg-[#fffafc] p-5 shadow-soft"
              >
                <div className="flex items-center justify-between text-sm text-[#7a3855]">
                  <span>{label}</span>
                  <Icon size={17} />
                </div>
                <div className="mt-3 text-3xl font-black text-[#5b2b45]">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black uppercase text-[#5b2b45]">
                Business analytics
              </h2>
              <p className="mt-1 text-sm text-[#7a3855]">
                Track bookings and sales performance
              </p>
            </div>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="rounded-full border border-[#ead4dd] bg-white px-4 py-2 text-sm font-semibold text-[#5b2b45]"
            >
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-[#5b2b45]">Bookings over time</h3>
                <span className="text-xs uppercase tracking-[0.16em] text-[#7a3855]">
                  {period}
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingTrend}>
                    <CartesianGrid stroke="#f0e1e7" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#5b2b45"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-5 shadow-soft">
              <h3 className="mb-4 font-bold text-[#5b2b45]">Booking status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        statusData.length
                          ? statusData
                          : [{ name: "No bookings", value: 1 }]
                      }
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {(statusData.length
                        ? statusData
                        : [{ name: "No bookings", value: 1 }]
                      ).map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            statusData.length
                              ? chartColors[index % chartColors.length]
                              : "#ead4dd"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-[#5f4253]">
                {statusData.map((item, index) => (
                  <span key={item.name} className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          chartColors[index % chartColors.length],
                      }}
                    />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-5 shadow-soft">
              <h3 className="mb-4 font-bold text-[#5b2b45]">
                Revenue over time
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingTrend}>
                    <CartesianGrid stroke="#f0e1e7" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => [`GHC ${value}`, "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#b36a86"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-5 shadow-soft">
              <h3 className="mb-4 font-bold text-[#5b2b45]">
                Most popular braid styles
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={popularStyles}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid stroke="#f0e1e7" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="bookings"
                      fill="#5b2b45"
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black uppercase text-[#5b2b45]">
                  Recent Bookings
                </h2>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a3855]">
                  Live
                </span>
              </div>

              <div className="space-y-3">
                {recentBookings.length === 0 ? (
                  <p className="text-sm text-[#5f4253]">No bookings yet.</p>
                ) : (
                  recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-[#ead4dd] bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-[#5b2b45]">
                            {booking.customerName}
                          </div>
                          <div className="text-sm text-[#5f4253]">
                            {booking.serviceName}
                          </div>
                        </div>
                        <span className="rounded-full bg-[#f9eaf1] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7a3855]">
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#5f4253]">
                        <span>{booking.date}</span>
                        <span>{booking.time}</span>
                        <span>
                          {booking.location || "Atonsu, Kumasi, Ghana"}
                        </span>
                        <a
                          href={mapLink(booking)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#7a3855] underline"
                        >
                          <ExternalLink size={12} /> Open map
                        </a>
                        <select
                          value={booking.status}
                          onChange={(event) =>
                            updateBookingStatus(booking.id, event.target.value)
                          }
                          className="ml-auto rounded-md border border-[#ead4dd] bg-white px-2 py-1 text-xs font-semibold text-[#5b2b45]"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#ead4dd] bg-[#fffafc] p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black uppercase text-[#5b2b45]">
                  Recent Orders
                </h2>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a3855]">
                  Sales
                </span>
              </div>

              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-[#5f4253]">No orders yet.</p>
                ) : (
                  recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-[#ead4dd] bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-[#5b2b45]">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-[#5f4253]">
                              {order.items?.length || 0} item(s) · {order.deliveryLocation || "Delivery method not provided"}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#5b2b45]">
                          GHC {Number(order.total || 0)}
                        </span>
                      </div>
                      <div className="mt-3 rounded-lg bg-[#fffafc] px-3 py-2 text-xs leading-5 text-[#5f4253]">
                        <div className="font-semibold text-[#5b2b45]">Delivery details</div>
                        <div>{order.address || "Address not provided"}</div>
                        {order.googleLocation && order.googleLocation !== order.address && <div>Map: {order.googleLocation}</div>}
                        <div>{order.city || "City not provided"}, {order.region || "Region not provided"} · {order.phone || "Phone not provided"}</div>
                        <a href={orderMapLink(order)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-[#7a3855] underline"><ExternalLink size={12} /> Open map</a>
                        {order.notes && <div className="italic">Note: {order.notes}</div>}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5f4253]">
                        <select
                          value={order.status}
                          onChange={(event) =>
                            updateOrderStatus(order.id, {
                              status: event.target.value,
                            })
                          }
                          className="rounded-md border border-[#ead4dd] bg-white px-2 py-1 font-semibold text-[#5b2b45]"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <select
                          value={order.paymentStatus}
                          onChange={(event) =>
                            updateOrderStatus(order.id, {
                              paymentStatus: event.target.value,
                            })
                          }
                          className="rounded-md border border-[#ead4dd] bg-white px-2 py-1 font-semibold text-[#5b2b45]"
                        >
                          <option value="Pending">Payment pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Failed">Payment failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
