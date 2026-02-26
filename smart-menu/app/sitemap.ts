import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.smartmenumk.com',
      lastModified: new Date(),
    },
  ]
}