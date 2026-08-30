export const imageFallback = '/hero_braids.jpg';

export const optimizeImageUrl = (url, width = 800) => {
  if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_80,f_auto,c_scale/`);
};

export const handleImageError = (event, fallback = imageFallback) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallback;
};
