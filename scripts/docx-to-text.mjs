// Zet een Word-document (.docx) om naar eenvoudige markdown-achtige tekst, zodat de
// structuur (koppen, lijstjes, vet, links) zichtbaar blijft bij het verwerken tot blog.
// Afbeeldingen die in het document zelf zitten worden optioneel uitgepakt.
//
// Gebruik: node scripts/docx-to-text.mjs <bestand.docx> [map-voor-afbeeldingen]

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const [file, mediaDir] = process.argv.slice(2)
if (!file) {
  console.error('Gebruik: node scripts/docx-to-text.mjs <bestand.docx> [map-voor-afbeeldingen]')
  process.exit(1)
}

const unzip = (entry, encoding = 'utf-8') => {
  try {
    return execFileSync('unzip', ['-p', file, entry], { encoding, maxBuffer: 64 * 1024 * 1024 })
  } catch {
    return null
  }
}

const decode = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const documentXml = unzip('word/document.xml')
if (!documentXml) {
  console.error(`❌ Geen geldig .docx-bestand: ${file}`)
  process.exit(1)
}

// Link-doelen staan in de relaties van het document
const links = new Map()
for (const m of (unzip('word/_rels/document.xml.rels') ?? '').matchAll(/<Relationship\b[^>]*>/g)) {
  const id = m[0].match(/Id="([^"]+)"/)?.[1]
  const target = m[0].match(/Target="([^"]+)"/)?.[1]
  if (id && target && /TargetMode="External"/.test(m[0])) links.set(id, decode(target))
}

function runsToText(xml) {
  let out = ''
  for (const r of xml.matchAll(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>|<w:r\b[\s\S]*?<\/w:r>/g)) {
    if (r[2] !== undefined) {
      const id = r[1].match(/r:id="([^"]+)"/)?.[1]
      const text = runsToText(r[2])
      out += id && links.has(id) ? `[${text}](${links.get(id)})` : text
      continue
    }
    const run = r[0]
    let text = ''
    for (const t of run.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
      if (t[0] === '<w:tab/>') text += ' '
      else if (t[0] === '<w:br/>') text += '\n'
      else text += decode(t[1])
    }
    const bold = /<w:b(?:\/>|\s(?![^>]*w:val="(?:0|false)")[^>]*\/>)/.test(run)
    const italic = /<w:i(?:\/>|\s(?![^>]*w:val="(?:0|false)")[^>]*\/>)/.test(run)
    if (text.trim() && bold) text = `**${text}**`
    else if (text.trim() && italic) text = `*${text}*`
    out += text
  }
  // Aangrenzende vette stukjes samenvoegen: **a****b** -> **ab**
  return out.replace(/\*\*\*\*/g, '')
}

const lines = []
const body = documentXml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? documentXml
for (const p of body.matchAll(/<w:p\b[\s\S]*?<\/w:p>|<w:p\b[^>]*\/>/g)) {
  const xml = p[0]
  const style = xml.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? ''
  const text = runsToText(xml).trim()
  const hasImage = /<w:drawing>|<w:pict>/.test(xml)
  if (!text) {
    if (hasImage) lines.push('[afbeelding in document]')
    continue
  }
  // Engelse en Nederlandse stijlnamen: Heading2 / Kop2 / Title / Titel
  const heading = style.match(/^(?:Heading|Kop)(\d)$/i)
  if (/^(Title|Titel)$/i.test(style)) lines.push(`# ${text}`)
  else if (heading) lines.push(`${'#'.repeat(Math.min(Number(heading[1]) + 1, 6))} ${text}`)
  else if (/<w:numPr>/.test(xml) || /^(ListParagraph|Lijstalinea)$/i.test(style)) lines.push(`- ${text}`)
  else lines.push(text)
  if (hasImage) lines.push('[afbeelding in document]')
}

// Lijstitems direct onder elkaar, al het andere met een witregel ertussen
console.log(
  lines
    .map((line, i) => (i === 0 ? '' : line.startsWith('- ') && lines[i - 1].startsWith('- ') ? '\n' : '\n\n') + line)
    .join(''),
)

if (mediaDir) {
  const list = execFileSync('unzip', ['-Z1', file], { encoding: 'utf-8' })
    .split('\n')
    .filter((f) => f.startsWith('word/media/'))
  if (list.length) {
    mkdirSync(mediaDir, { recursive: true })
    for (const entry of list) {
      const target = join(mediaDir, basename(entry))
      writeFileSync(target, execFileSync('unzip', ['-p', file, entry], { maxBuffer: 64 * 1024 * 1024 }))
      console.error(`afbeelding uitgepakt: ${target}`)
    }
  }
}
