import type { APIRoute } from 'astro'
import { getPublishedPostsNewestFirst } from '../utils/blog.ts'

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('Astro `site` config is not set; cannot build llms.txt')
  }

  const base = import.meta.env.BASE_URL
  const url = (path: string) => `${site.origin}${base}${path}`.replace(/([^:])\/\//g, '$1/')

  // Meest recente artikelen, zodat deze lijst niet naar verwijderde blogs verwijst
  const recentPosts = getPublishedPostsNewestFirst()
    .slice(0, 6)
    .map((post) => `- [${post.title}](${url(`blog/${post.slug}`)}): ${post.shortDescription}`)
    .join('\n')

  const body = `# fit.foodbyshyla

> Shyla is een Nederlandse voedingscoach die helpt bij het bouwen van een gezonde lifestyle zonder strenge diëten. Focus op balans, eten met plezier, en het doorbreken van emotie-eten en binge-eating patronen. Werkt 1-op-1 met klanten via persoonlijke coaching, wekelijkse check-ins en een eigen app.

## Over Shyla

- [Over mij](${url('over-mij')}): Shyla's persoonlijke verhaal: hoe ze in 2022 weduwe werd op 27-jarige leeftijd, in patronen van emotie-eten belandde, en in 2024 15 kilo verloor en haar relatie met voeding herontdekte zonder strenge regels.
- [Werkwijze en veelgestelde vragen](${url('faq')}): Hoe een coachingstraject bij Shyla werkt, wat je krijgt, en antwoorden op vragen over emotie-eten, maaltijdschema's, afvallen en duurzame verandering.

## Aanbod

- [Plan een kennismaking](${url('afspraak')}): Gratis kennismakingsgesprek. Bij een match: 1-op-1 coaching met wekelijkse check-ins, een persoonlijk voedingsplan, toegang tot Shyla's coaching-app met workouts, elke twee weken een call, en 24/7 contactmogelijkheid.
- [Contact](${url('contact')}): Bericht sturen voor vragen, samenwerkingen, of als je wilt overleggen welk traject bij jou past. Reactie binnen 1-2 werkdagen.
- [Samenwerkingen](${url('samenwerkingen')}): Mogelijkheden voor merken die passen bij gezond en lekker eten.

## Lezen & leren

- [Blog overzicht](${url('blog')}): Eerlijke artikelen over voeding, leefstijl en gezond leven, geschreven vanuit eigen ervaring.
${recentPosts}

## Filosofie & uitgangspunten

- Geen strenge diëten of vaste verboden
- Plezier en duurzaamheid staan boven snelle resultaten
- Persoonlijk traject, geen standaard schema's
- Speciale aandacht voor emotie-eten en binge-eating recovery
- Begeleiding op het tempo dat bij de klant past
- 1-op-1 coaching, geen groepsprogramma's

## Contact

- E-mail: info@fitfoodbyshyla.nl
- Instagram: @fit.foodbyshyla
- TikTok: @fit.foodbyshyla
- Website: ${site.origin}${base}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
