// Geeft de eerstvolgende vrije publicatiedatums (maandagen) voor nieuwe blogs.
// De wekelijkse deploy draait maandag 07:00, dus een blog met een maandag als datum
// gaat die ochtend live. Elke nieuwe blog komt minstens een week na de vorige.
//
// Gebruik: node scripts/blog-slots.mjs <aantal>

import { readFileSync } from 'node:fs'

const count = Number(process.argv[2] ?? 1)
const posts = JSON.parse(readFileSync(new URL('../src/data/blog.json', import.meta.url), 'utf-8'))

const toIso = (d) => d.toISOString().slice(0, 10)
const addDays = (d, n) => new Date(d.getTime() + n * 86_400_000)

const today = new Date(
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date()) + 'T00:00:00Z',
)
const latest = posts.map((p) => p.date).sort().at(-1)

// Eerste maandag na vandaag (vandaag zelf niet: de deploy van 07:00 kan al geweest zijn)
let slot = addDays(today, ((8 - today.getUTCDay()) % 7) || 7)
while (latest && toIso(slot) < toIso(addDays(new Date(latest + 'T00:00:00Z'), 7))) slot = addDays(slot, 7)

const slots = []
for (let i = 0; i < count; i++) slots.push(toIso(addDays(slot, i * 7)))

console.log(`Laatste blog in blog.json: ${latest ?? 'geen'}`)
console.log(`Volgende id: ${Math.max(0, ...posts.map((p) => p.id)) + 1}`)
console.log(`Publicatiedatums: ${slots.join(', ')}`)
