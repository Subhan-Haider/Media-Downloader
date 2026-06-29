import { MetadataRoute } from 'next';
import { blogs } from '@/data/blogs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrls = [
    'https://media-downloader.subhan.tech',
    'https://media.subhan.tech',
    'https://media.lootops.me'

  ];

  // If there is a custom NEXT_PUBLIC_SITE_URL, add it to the list
  if (process.env.NEXT_PUBLIC_SITE_URL && !baseUrls.includes(process.env.NEXT_PUBLIC_SITE_URL)) {
    baseUrls.unshift(process.env.NEXT_PUBLIC_SITE_URL);
  }

  const paths = [
    '',
    '/library',
    '/queue',
    '/subscriptions',
    '/privacy',
    '/terms',
    '/about',
    '/blog',
  ];

  const allRoutes: MetadataRoute.Sitemap = [];

  for (const baseUrl of baseUrls) {
    const staticRoutes = paths.map((route) => ({
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

    allRoutes.push(...staticRoutes, ...blogRoutes);
  }

  return allRoutes;
}
