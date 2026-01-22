export const getProxiedImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.includes('base44.app') || url.includes('supabase.co')) return url;
    // Use wsrv.nl as proxy for external images to bypass CORS/Hotlink protection
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
};