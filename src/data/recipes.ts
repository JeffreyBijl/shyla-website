export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack'

export interface Recipe {
  id: number
  title: string
  category: RecipeCategory
  emoji: string
  time: string
  calories: string
  description: string
}

export const recipes: Recipe[] = [
  {
    id: 1,
    title: 'Overnight oats met aardbei',
    category: 'ontbijt',
    emoji: '🍓',
    time: '10 min',
    calories: '320 kcal',
    description: 'Romige haver met verse aardbeien en een vleugje honing. Bereid de avond van tevoren voor een zorgeloos ochtend.',
  },
  {
    id: 2,
    title: 'Avocado toast met ei',
    category: 'ontbijt',
    emoji: '🥑',
    time: '15 min',
    calories: '380 kcal',
    description: 'Knapperig volkorenbrood met gecremede avocado, een gepocheerd ei en chilivlokken.',
  },
  {
    id: 3,
    title: 'Griekse salade bowl',
    category: 'lunch',
    emoji: '🥗',
    time: '20 min',
    calories: '290 kcal',
    description: 'Frisse bowl met komkommer, tomaat, olijven, feta en een citroen-olijfolie dressing.',
  },
  {
    id: 4,
    title: 'Kip teriyaki met quinoa',
    category: 'diner',
    emoji: '🍗',
    time: '35 min',
    calories: '520 kcal',
    description: 'Sappige kipfilet in een zoet-zoute teriyaki saus, geserveerd op luchtige quinoa met broccolini.',
  },
  {
    id: 5,
    title: 'Zalm met geroosterde groenten',
    category: 'diner',
    emoji: '🐟',
    time: '40 min',
    calories: '480 kcal',
    description: 'Oven gebakken zalmfilet met kleurrijke geroosterde paprika, courgette en zoete aardappel.',
  },
  {
    id: 6,
    title: 'Proteïne smoothie',
    category: 'snack',
    emoji: '🥤',
    time: '5 min',
    calories: '210 kcal',
    description: 'Roze smoothie met banaan, aardbei, Griekse yoghurt en een schepje proteïnepoeder.',
  },
]
