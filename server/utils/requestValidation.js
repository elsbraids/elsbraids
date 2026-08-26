const cleanText = (value, maxLength = 500) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value) => /^[+\d][\d\s()-]{6,24}$/.test(value);

const parseSafeUrl = (value, allowedHosts = []) => {
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return '';
    if (allowedHosts.length && !allowedHosts.includes(parsed.hostname.toLowerCase())) return '';
    return parsed.toString();
  } catch {
    return '';
  }
};

const parseItems = (items, maxItems = 50) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > maxItems) return null;
  const parsed = items.map((item) => ({
    productId: cleanText(item?.productId || item?.id, 80),
    quantity: Number(item?.quantity),
  }));
  if (parsed.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) return null;
  return parsed;
};

module.exports = { cleanText, isEmail, isPhone, parseSafeUrl, parseItems };
