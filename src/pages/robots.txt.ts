import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('Astro `site` config is not set; cannot build robots.txt')
  }

  const base = import.meta.env.BASE_URL
  const sitemapUrl = `${site.origin}${base}sitemap-index.xml`

  const body = `# robots.txt — fit.foodbyshyla
# Strategie: maximale vindbaarheid in Google + AI-zoeksystemen

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: *
Allow: /
Disallow: ${base}admin-shyla
Disallow: ${base}api/

Sitemap: ${sitemapUrl}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
