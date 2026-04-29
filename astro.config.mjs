import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vue from '@astrojs/vue'

const isProd = process.env.DEPLOY_TARGET === 'production'

export default defineConfig({
  site: isProd ? 'https://fitfoodbyshyla.nl' : 'https://jeffreybijl.github.io',
  base: isProd ? '/' : '/shyla-website/',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('admin-shyla'),
    }),
    vue({ appEntrypoint: '/src/admin/main' }),
  ],
})
