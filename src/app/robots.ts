import type { MetadataRoute } from 'next';
import { urlAplikasi } from '@/lib/url-aplikasi';
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/akun', '/checkout', '/wishlist', '/api/', '/masuk', '/daftar', '/lupa-password', '/reset-password'] }, sitemap: `${urlAplikasi(process.env)}/sitemap.xml` }; }
