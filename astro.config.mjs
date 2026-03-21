import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://jeffreybijl.github.io',
  base: '/shyla-website/',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('admin-shyla'),
    }),
  ],
})
