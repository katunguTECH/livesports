import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sports4.life'
  
  const sports = ['soccer', 'basketball', 'football', 'baseball', 'hockey', 'tennis', 'mma', 'golf', 'rugby']
  
  const sportRoutes = sports.map((sport) => ({
    url: `${baseUrl}/?sport=${sport}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 1,
    },
    ...sportRoutes,
  ]
}