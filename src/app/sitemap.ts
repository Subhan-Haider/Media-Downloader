import { MetadataRoute } from 'next';
import { blogs } from '@/data/blogs';

export default function sitemap(): MetadataRoute.Sitemap {
  // Use the environment variable if available, otherwise default to the primary domain
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://media-downloader.subhan.tech';

  const staticRoutes = [
    '',
    '/library',
    '/queue',
    '/subscriptions',
    '/privacy',
    '/about',
    '/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const blogRoutes = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
