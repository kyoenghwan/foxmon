import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { SEO_KEYWORDS } from '@/lib/seo-keywords';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foxmon.com';

  // 1. Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/seekers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/special-jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // 2. Dynamic SEO Keyword Landing Pages
  const keywordRoutes: MetadataRoute.Sitemap = SEO_KEYWORDS.map((keyword) => ({
    url: `${baseUrl}/k/${encodeURIComponent(keyword)}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  }));

  // 3. Dynamic Job Details Pages
  // Fetch active jobs from database
  // Note: For large databases, consider pagination or limiting the sitemap size
  const { data: activeJobs } = await supabase
    .from('jobs')
    .select('id, updated_at')
    .eq('status', 'ACTIVE')
    .limit(5000); // Limit to prevent oversized sitemaps

  const jobRoutes: MetadataRoute.Sitemap = (activeJobs || []).map((job) => ({
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: new Date(job.updated_at || new Date()),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  return [...staticRoutes, ...keywordRoutes, ...jobRoutes];
}
