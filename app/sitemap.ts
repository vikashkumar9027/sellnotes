import { MetadataRoute } from 'next';
import { store } from '@/lib/store';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notemart.edu';
  const notes = store.getApprovedNotes();
  const categories = store.getCategories();

  const staticPages = [
    '',
    '/notes',
    '/categories',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/copyright-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const notePages = notes.map((n) => ({
    url: `${baseUrl}/notes/${n.slug}`,
    lastModified: new Date(n.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const categoryPages = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...notePages, ...categoryPages];
}
