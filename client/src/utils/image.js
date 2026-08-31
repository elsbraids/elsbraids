export const imageFallback = '/hero_braids.jpg';

export const optimizeImageUrl = (url, width = 800) => {
  if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_80,f_auto,c_scale/`);
};

export const optimizeImageSrcSet = (url, widths = [400, 800, 1200, 1600]) => {
  if (!url || typeof url !== 'string' || url.startsWith('data:')) return undefined;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return undefined;
  
  return widths
    .map((w) => `${url.replace('/upload/', `/upload/w_${w},q_80,f_auto,c_scale/`)} ${w}w`)
    .join(', ');
};

export const handleImageError = (event, fallback = imageFallback) => {
  console.warn('[image] Failed to load image; using fallback', {
    source: event.currentTarget.src,
    fallback,
  });
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallback;
};
