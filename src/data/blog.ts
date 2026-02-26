export interface BlogPost {
  id: number
  title: string
  date: string
  category: string
  excerpt: string
  readTime: string
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: '5 tips voor een gezond ontbijt dat je de hele ochtend volhoudt',
    date: '15 februari 2026',
    category: 'Voeding',
    excerpt: 'Een goed ontbijt is de basis van een productieve dag. Ontdek welke voedingsstoffen je niet mag overslaan en hoe je ze makkelijk in je ochtend verwerkt.',
    readTime: '4 min',
  },
  {
    id: 2,
    title: 'Waarom proteïne zo belangrijk is voor vrouwen',
    date: '8 februari 2026',
    category: 'Educatie',
    excerpt: 'Proteïne is meer dan spierherstel. Leer hoe het je hormoonbalans, huid en energieniveau ondersteunt — en hoeveel je eigenlijk nodig hebt.',
    readTime: '6 min',
  },
  {
    id: 3,
    title: 'Meal prep in 1 uur: zo plan je een hele week voor',
    date: '1 februari 2026',
    category: 'Lifestyle',
    excerpt: 'Met de juiste aanpak kun je in één uur alle maaltijden voor de week voorbereiden. Mijn stap-voor-stap methode voor beginners.',
    readTime: '5 min',
  },
  {
    id: 4,
    title: 'De waarheid over "gezonde" snacks uit de supermarkt',
    date: '22 januari 2026',
    category: 'Voeding',
    excerpt: 'Veel producten met een gezond imago bevatten verrassend veel suiker of additieven. Ik leer je hoe je een etiket leest als een pro.',
    readTime: '7 min',
  },
]
