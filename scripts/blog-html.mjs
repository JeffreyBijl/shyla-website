// Zet de uitvoer van docx-to-text.mjs om naar blog-HTML in de stijl van blog.json:
// koppen, lijstjes, vet/schuin, links en speciale tekens als HTML-entities.
// De eerste regel (de titel) wordt overgeslagen. Twijfelgevallen gaan naar stderr.
//
// Gebruik: node scripts/blog-html.mjs <tekst.md>

import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('Gebruik: node scripts/blog-html.mjs <tekst.md>')
  process.exit(1)
}

const ENTITIES = {
  á: 'aacute', à: 'agrave', ä: 'auml', â: 'acirc', é: 'eacute', è: 'egrave', ë: 'euml', ê: 'ecirc',
  í: 'iacute', ï: 'iuml', î: 'icirc', ó: 'oacute', ò: 'ograve', ö: 'ouml', ô: 'ocirc', ú: 'uacute',
  ü: 'uuml', û: 'ucirc', ç: 'ccedil', ñ: 'ntilde', É: 'Eacute', È: 'Egrave', Ë: 'Euml', Ï: 'Iuml',
  Ö: 'Ouml', Ü: 'Uuml', '‘': 'lsquo', '’': 'rsquo', '“': 'ldquo', '”': 'rdquo', '–': 'ndash',
  '—': 'mdash', '…': 'hellip', '≈': 'asymp', '×': 'times', '±': 'plusmn', '°': 'deg', '€': 'euro',
  '½': 'frac12', '¼': 'frac14', '²': 'sup2', '³': 'sup3', '•': 'bull', '·': 'middot', '→': 'rarr',
  '≤': 'le', '≥': 'ge', ' ': 'nbsp',
}

function text(s) {
  return (
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Rechte aanhalingstekens omzetten naar typografische, zoals in de bestaande blogs
      .replace(/"([^"]*)"/g, '“$1”')
      .replace(/(^|[\s(*“])'(?!s\b)(?=\S)/g, '$1‘')
      .replace(/'/g, '’')
      .replace(/[^\x00-\x7f]/g, (c) => (ENTITIES[c] ? `&${ENTITIES[c]};` : `&#${c.codePointAt(0)};`))
  )
}

function inline(s) {
  const links = []
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    links.push(`<a href="${url.replace(/&/g, '&amp;')}" target="_blank" rel="noopener">${text(label)}</a>`)
    return `\u0000${links.length - 1}\u0000`
  })
  return text(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => links[i])
}

const blocks = readFileSync(file, 'utf-8').trim().split(/\n{2,}/)
blocks.shift()

const html = []
for (const block of blocks) {
  if (block === '[afbeelding in document]') {
    html.push('<!-- AFBEELDING -->')
    console.error('let op: afbeelding in document, vervang <!-- AFBEELDING --> door het plaatje')
    continue
  }
  const lines = block.split('\n')
  if (lines.every((l) => l.startsWith('- '))) {
    html.push(`<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`)
    continue
  }
  const heading = block.match(/^(#{2,4}) (.+)$/)
  if (heading) {
    const level = Math.min(heading[1].length, 3)
    html.push(`<h${level}>${inline(heading[2].replace(/^\*\*(.*)\*\*$/, '$1'))}</h${level}>`)
    continue
  }
  // Een alinea die helemaal vet is, is een tussenkop. Behalve als het een hele zin is
  // (eindigt op een punt): dan is het een benadrukte zin.
  const bold = block.match(/^\*\*([^*]+)\*\*$/)
  if (bold && !/[.!:]$/.test(bold[1].trim())) {
    html.push(`<h2>${inline(bold[1].trim())}</h2>`)
    continue
  }
  // Korte losse regel zonder punt aan het eind (geen citaat of rekensom): misschien een kop
  if (!bold && block.length < 90 && !/[.!:;,)]$/.test(block) && !/^[*“"']|[≈=×]/.test(block) && !block.includes('\n')) {
    console.error(`twijfel: mogelijk een tussenkop zonder opmaak: "${block}"`)
  }
  html.push(`<p>${inline(block)}</p>`)
}

console.log(html.join(''))
