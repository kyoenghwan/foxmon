import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foxmon.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/fox-office/', '/api/', '/biz/', '/mypage/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
