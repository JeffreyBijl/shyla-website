import SftpClient from 'ssh2-sftp-client'
import { resolve } from 'node:path'
import { existsSync, readFileSync, statSync } from 'node:fs'

const envFile = resolve('.env.deploy')
if (!existsSync(envFile)) {
  console.error('❌ .env.deploy ontbreekt.')
  console.error('   Kopieer .env.deploy.example naar .env.deploy en vul de TransIP-gegevens in.')
  process.exit(1)
}
for (const line of readFileSync(envFile, 'utf-8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (!(key in process.env)) process.env[key] = val
}

const required = ['SFTP_HOST', 'SFTP_USER', 'SFTP_PASS', 'SFTP_REMOTE_PATH']
const missing = required.filter((k) => !process.env[k] || process.env[k].startsWith('JOUW_'))
if (missing.length) {
  console.error(`❌ Niet of onvolledig ingevuld in .env.deploy: ${missing.join(', ')}`)
  process.exit(1)
}

const cfg = {
  host: process.env.SFTP_HOST,
  port: Number(process.env.SFTP_PORT || 22),
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASS,
  readyTimeout: 20_000,
}
const remotePath = process.env.SFTP_REMOTE_PATH
const localPath = resolve('dist')

if (!existsSync(localPath) || !statSync(localPath).isDirectory()) {
  console.error(`❌ Geen build gevonden op ${localPath}`)
  console.error('   Draai eerst: npm run build:prod')
  process.exit(1)
}

const sftp = new SftpClient()
const start = Date.now()
let uploaded = 0

sftp.on('upload', () => uploaded++)

console.log(`→ Verbinden met ${cfg.host}:${cfg.port} als ${cfg.username}...`)

try {
  await sftp.connect(cfg)
  console.log(`✓ Verbonden`)

  const remoteExists = await sftp.exists(remotePath)
  if (!remoteExists) {
    console.error(`❌ Remote pad bestaat niet: ${remotePath}`)
    try {
      const cwd = await sftp.cwd()
      console.error(`   SFTP cwd: ${cwd}`)
      const rootList = await sftp.list('/')
      console.error(`   Inhoud van /: ${rootList.map(f => (f.type === 'd' ? f.name + '/' : f.name)).join(', ')}`)
      const homeList = await sftp.list(cwd)
      console.error(`   Inhoud van ${cwd}: ${homeList.map(f => (f.type === 'd' ? f.name + '/' : f.name)).join(', ')}`)
    } catch (e) {
      console.error('   (kon directorystructuur niet ophalen:', e.message + ')')
    }
    process.exit(1)
  }

  // Eénmalige cleanup: oude leftover-bestanden weghalen die niet meer in de build zitten
  const obsolete = ['vite.svg']
  for (const name of obsolete) {
    const full = `${remotePath}/${name}`
    if (await sftp.exists(full)) {
      await sftp.delete(full)
      console.log(`  ✓ verwijderd: ${name}`)
    }
  }

  console.log(`→ Uploaden ${localPath} → ${remotePath}`)
  await sftp.uploadDir(localPath, remotePath)

  const seconds = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`✓ Klaar — ${uploaded} bestanden in ${seconds}s`)
  console.log(`  https://fitfoodbyshyla.nl/`)
} catch (err) {
  console.error('❌ Deploy mislukt:', err.message)
  process.exitCode = 1
} finally {
  await sftp.end().catch(() => {})
}
