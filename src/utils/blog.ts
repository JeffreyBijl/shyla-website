import type { BlogPost } from '../data/types.ts'
import blogData from '../data/blog.json'

/** Datum van de build (Europe/Amsterdam) als YYYY-MM-DD. */
function buildDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Blogs met een datum in de toekomst worden niet meegebouwd. Zo kun je een blog
 * alvast committen zonder dat een tussentijdse deploy hem te vroeg live zet;
 * hij verschijnt bij de eerste deploy op of na zijn publicatiedatum.
 *
 * Met SHOW_SCHEDULED=1 (alleen lokaal, bijv. `SHOW_SCHEDULED=1 npm run dev`) worden
 * ingeplande blogs wel getoond, om ze vooraf te kunnen bekijken.
 */
export function getPublishedPosts(): BlogPost[] {
  if (process.env.SHOW_SCHEDULED === '1') return blogData as BlogPost[]
  const today = buildDate()
  return (blogData as BlogPost[]).filter((post) => post.date <= today)
}

/** Gepubliceerde blogs, meest recente eerst. */
export function getPublishedPostsNewestFirst(): BlogPost[] {
  return getPublishedPosts().sort((a, b) => b.date.localeCompare(a.date))
}
