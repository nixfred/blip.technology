// Contributors for the site. Refreshed from GitHub at build time; the committed
// src/data/contributors.json and src/data/avatars/ are the fallback, so a failed
// fetch (offline, rate limited) never fails the build.
//   people: everyone with a merged PR or commits on the repo, bots removed
//   x:      an X handle only when the project's CONTRIBUTORS-X.md lists one
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type Person = {
  login: string
  commits: number
  prs: { n: number; title: string }[]
  x?: string
  avatarSrc?: string
}
export type ContributorData = { fetched: string; repo: string; people: Person[] }

const ROOT = join(import.meta.dir, '..')
const DATA = join(ROOT, 'src', 'data')
export const FILE = join(DATA, 'contributors.json')
export const AVATARS = join(DATA, 'avatars')

const isBot = (login: string, type?: string) => type === 'Bot' || /\[bot\]$|^dependabot|^github-actions/i.test(login)

async function gh(url: string, accept = 'application/vnd.github+json') {
  const headers: Record<string, string> = { accept, 'user-agent': 'blip.technology-build' }
  const tok = process.env.GITHUB_TOKEN
  if (tok) headers.authorization = `Bearer ${tok}`
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${url} ${res.status}`)
  return res
}

async function pages<T>(url: string): Promise<T[]> {
  const out: T[] = []
  for (let p = 1; p <= 10; p++) {
    const rows = (await (await gh(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${p}`)).json()) as T[]
    out.push(...rows)
    if (rows.length < 100) break
  }
  return out
}

function parseXRoster(md: string): Map<string, string> {
  const m = new Map<string, string>()
  for (const line of md.split('\n')) {
    const r = line.match(/^\|\s*[^|]+?\s*\|\s*([A-Za-z0-9-]+)\s*\|\s*https:\/\/x\.com\/([A-Za-z0-9_]{1,15})\s*\|/)
    if (r) m.set(r[1].toLowerCase(), r[2])
  }
  return m
}

export function avatarFile(login: string): string | undefined {
  if (!existsSync(AVATARS)) return undefined
  return readdirSync(AVATARS).find((f) => f.replace(/\.[a-z0-9]+$/i, '') === login)
}

export async function fetchContributors(repoSlug: string, today: string): Promise<ContributorData> {
  const api = `https://api.github.com/repos/${repoSlug}`
  type Con = { login: string; type: string; contributions: number; avatar_url: string }
  type Pull = { number: number; title: string; merged_at: string | null; user: { login: string; type: string; avatar_url: string } }
  const [cons, pulls] = await Promise.all([pages<Con>(`${api}/contributors`), pages<Pull>(`${api}/pulls?state=closed`)])
  let roster = new Map<string, string>()
  try {
    roster = parseXRoster(await (await gh(`https://raw.githubusercontent.com/${repoSlug}/main/CONTRIBUTORS-X.md`, '*/*')).text())
  } catch (e) {
    console.warn(`contributors: X roster not read (${e}); keeping X handles from the committed file`)
  }
  const by = new Map<string, Person & { avatarUrl?: string }>()
  const get = (login: string) => {
    if (!by.has(login)) by.set(login, { login, commits: 0, prs: [] })
    return by.get(login)!
  }
  for (const c of cons) {
    if (isBot(c.login, c.type)) continue
    const p = get(c.login)
    p.commits = c.contributions
    p.avatarUrl = c.avatar_url
  }
  for (const pr of pulls) {
    if (!pr.merged_at || !pr.user || isBot(pr.user.login, pr.user.type)) continue
    const p = get(pr.user.login)
    p.prs.push({ n: pr.number, title: pr.title })
    p.avatarUrl ??= pr.user.avatar_url
  }
  let old: ContributorData | undefined
  try { old = JSON.parse(readFileSync(FILE, 'utf8')) } catch {}
  mkdirSync(AVATARS, { recursive: true })
  const people: Person[] = []
  for (const p of by.values()) {
    p.prs.sort((a, b) => a.n - b.n)
    if (!avatarFile(p.login) && p.avatarUrl) {
      try {
        const res = await fetch(p.avatarUrl + (p.avatarUrl.includes('?') ? '&' : '?') + 's=96', { signal: AbortSignal.timeout(20000) })
        if (res.ok) {
          const type = res.headers.get('content-type') ?? ''
          const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
          writeFileSync(join(AVATARS, `${p.login}.${ext}`), new Uint8Array(await res.arrayBuffer()))
        }
      } catch (e) {
        console.warn(`contributors: avatar for ${p.login} not fetched (${e})`)
      }
    }
    const x = roster.get(p.login.toLowerCase()) ?? old?.people.find((o) => o.login === p.login)?.x
    people.push({ login: p.login, commits: p.commits, prs: p.prs, ...(x ? { x } : {}) })
  }
  people.sort((a, b) => b.prs.length - a.prs.length || b.commits - a.commits || a.login.localeCompare(b.login))
  return { fetched: today, repo: repoSlug, people }
}

export async function loadContributors(repoSlug: string, today: string): Promise<ContributorData> {
  try {
    const d = await fetchContributors(repoSlug, today)
    if (d.people.length < 5) throw new Error('too few people')
    writeFileSync(FILE, JSON.stringify(d, null, 2) + '\n')
    console.log(`contributors: fetched ${d.people.length} people`)
    return d
  } catch (e) {
    if (!existsSync(FILE)) throw new Error(`contributors fetch failed (${e}) and no committed ${FILE}`)
    const d = JSON.parse(readFileSync(FILE, 'utf8')) as ContributorData
    console.warn(`contributors: fetch failed (${e}); using committed data from ${d.fetched}`)
    return d
  }
}
