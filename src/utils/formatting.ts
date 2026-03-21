const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

/** Convert ISO date string (2026-02-15) to Dutch display format (15 februari 2026) */
export function formatDateDutch(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${day} ${DUTCH_MONTHS[month - 1]} ${year}`
}

/** Parse time string like "30 min" to ISO 8601 duration "PT30M" */
export function parseTimeToISO(time: string): string {
  const match = time.match(/(\d+)\s*(?:min|minuten)/)
  if (!match) return 'PT0M'
  return `PT${match[1]}M`
}

/** Format ingredient as readable string: "80g havermout" or "1 stuk(s) ui" */
export function formatIngredient(amount: number | null, unit: string, name: string): string {
  const parts: string[] = []
  if (amount !== null) {
    parts.push(formatAmount(amount))
    if (unit) parts.push(unit)
  }
  parts.push(name)
  return parts.join(' ')
}

function formatAmount(amount: number): string {
  if (amount === 0.25) return '\u00BC'
  if (amount === 0.5) return '\u00BD'
  if (amount === 0.75) return '\u00BE'
  if (Number.isInteger(amount)) return String(amount)
  const rounded = Math.round(amount * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
}
