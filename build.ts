// Static build: src/ -> dist/. No framework. Run with `bun build.ts`.
// 1. refresh GitHub stats (never fails the build if a committed file exists)
// 2. copy src/public as is, hash-name css/js/images under /assets
// 3. render index.html, 404.html, index.md, robots, sitemap, _headers
// 4. render agent skills and compute sha256 digests for index.json
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import * as C from './src/content.ts'
import { AVATARS, avatarFile, loadContributors, type ContributorData, type Person } from './tools/contributors.ts'

const ROOT = import.meta.dir
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const STATS_FILE = join(SRC, 'data', 'github-stats.json')
const { SITE } = C

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const sha256 = (b: string | Uint8Array) => createHash('sha256').update(b).digest('hex')
const nyDate = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso + 'T12:00:00Z'))

/* ---------------------------------------------------------------- stats */
type Stats = { stars: number; forks: number; contributors: number; fetched: string }

async function fetchStats(): Promise<Stats> {
  const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'user-agent': 'blip.technology-build' }
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const api = `https://api.github.com/repos/${SITE.repoSlug}`
  const repo = await fetch(api, { headers, signal: AbortSignal.timeout(15000) })
  if (!repo.ok) throw new Error(`repo ${repo.status}`)
  const r = (await repo.json()) as { stargazers_count: number; forks_count: number }
  const con = await fetch(`${api}/contributors?per_page=1`, { headers, signal: AbortSignal.timeout(15000) })
  if (!con.ok) throw new Error(`contributors ${con.status}`)
  const link = con.headers.get('link') ?? ''
  const last = link.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/)
  const contributors = last ? Number(last[1]) : ((await con.json()) as unknown[]).length
  if (![r.stargazers_count, r.forks_count, contributors].every((n) => Number.isInteger(n) && n >= 0)) throw new Error('bad numbers')
  return { stars: r.stargazers_count, forks: r.forks_count, contributors, fetched: nyDate() }
}

async function loadStats(): Promise<Stats> {
  try {
    const s = await fetchStats()
    mkdirSync(join(SRC, 'data'), { recursive: true })
    writeFileSync(STATS_FILE, JSON.stringify(s, null, 2) + '\n')
    console.log('stats: fetched', s)
    return s
  } catch (e) {
    if (!existsSync(STATS_FILE)) throw new Error(`stats fetch failed (${e}) and no committed ${STATS_FILE}`)
    const s = JSON.parse(readFileSync(STATS_FILE, 'utf8')) as Stats
    console.warn(`stats: fetch failed (${e}); using committed numbers from ${s.fetched}`)
    return s
  }
}

/* ------------------------------------------------- README install check */
async function checkReadme() {
  try {
    const res = await fetch(SITE.readmeRaw, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(String(res.status))
    const md = await res.text()
    const missing = C.INSTALL_LINES.filter((l) => !md.includes(l))
    if (missing.length) console.warn('readme check: INSTALL DIFFERS from the live README. Update src/content.ts. Missing:\n' + missing.join('\n'))
    else console.log('readme check: install commands match the README')
  } catch (e) {
    console.warn(`readme check skipped (${e})`)
  }
}

/* --------------------------------------------------------------- assets */
const assetMap = new Map<string, string>() // "assets/site.css" -> "/assets/site.<hash>.css"
function emitAsset(name: string, bytes: Uint8Array) {
  const ext = extname(name)
  const hashed = `${basename(name, ext)}.${sha256(bytes).slice(0, 10)}${ext}`
  writeFileSync(join(DIST, 'assets', hashed), bytes)
  assetMap.set(name, `/assets/${hashed}`)
}
const A = (name: string) => assetMap.get(name) ?? (() => { throw new Error('missing asset ' + name) })()

/* --------------------------------------------- contributors and quotes */
type Note = { name: string; role?: string; writeup: string }
type Notes = { people: Record<string, Note>; issues: { login: string; name: string; what: string }[] }
type Quote = { id: string; name: string; handle: string; text: string; partial: boolean }
const readJson = <T,>(f: string) => JSON.parse(readFileSync(join(SRC, 'data', f), 'utf8')) as T
const GH = 'https://github.com'
const noDash = (t: string) => t.replace(/\s*[\u2013\u2014]\s*/g, ', ')

// "#12" becomes a pull request link and "sha:abc1234" a commit link
function linkify(text: string) {
  return esc(text)
    .replace(/#(\d+)/g, (_, n) => `<a href="${SITE.repo}/pull/${n}">#${n}</a>`)
    .replace(/sha:([0-9a-f]{7,40})/g, (_, h) => `<a href="${SITE.repo}/commit/${h}">${h.slice(0, 7)}</a>`)
}
const plain = (t: string) => t.replace(/sha:/g, '')

function writeup(p: Person, notes: Notes) {
  const n = notes.people[p.login]
  if (n) return n.writeup
  if (p.prs.length) return `Merged ${p.prs.slice(0, 2).map((r) => `#${r.n}, ${noDash(r.title)}`).join(' and ')}.`
  return `Contributed ${p.commits} commit${p.commits === 1 ? '' : 's'}.`
}

function sortedPeople(d: ContributorData) {
  return [...d.people].sort(
    (a, b) => Number(b.login === 'nixfred') - Number(a.login === 'nixfred') || b.prs.length - a.prs.length || b.commits - a.commits || a.login.localeCompare(b.login),
  )
}

function contributorsHtml(d: ContributorData, notes: Notes) {
  const people = sortedPeople(d)
  const cards = people
    .map((p) => {
      const n = notes.people[p.login]
      const name = n?.name ?? p.login
      const av = avatarFile(p.login)
      const role = p.login === 'nixfred' ? 'Author and maintainer' : n?.role
      const work = p.prs.length
        ? `<a href="${GH}/${SITE.repoSlug}/pulls?q=${encodeURIComponent(`is:pr is:merged author:${p.login}`)}">${p.prs.length} merged PR${p.prs.length === 1 ? '' : 's'}</a>`
        : `<a href="${GH}/${SITE.repoSlug}/commits?author=${encodeURIComponent(p.login)}">${p.commits} commit${p.commits === 1 ? '' : 's'}</a>`
      return `<li class="person">
<div class="who">
${av ? `<img class="av" src="${A('av-' + av)}" width="48" height="48" loading="lazy" decoding="async" alt="">` : '<span class="av av-none" aria-hidden="true"></span>'}
<div>
<h3>${esc(name)}</h3>
<p class="handle">@${esc(p.login)}${role ? ` · ${esc(role)}` : ''}</p>
</div>
</div>
<p class="did">${linkify(writeup(p, notes))}</p>
<p class="meta"><a href="${GH}/${encodeURIComponent(p.login)}">GitHub</a>${p.x ? `<a href="https://x.com/${encodeURIComponent(p.x)}">X @${esc(p.x)}</a>` : ''}${work}</p>
</li>`
    })
    .join('\n')
  const issues = notes.issues
    .map((i) => `<a class="ul-link" href="${GH}/${encodeURIComponent(i.login)}">${esc(i.name)}</a> (${linkify(i.what)})`)
    .join(', ')
  return `<section class="sec" id="contributors">
<div class="wrap">
<h2>Contributors</h2>
<p>${esc(C.CONTRIB_INTRO)}</p>
<p class="count"><b>${people.length}</b> people: Fred Nix, who wrote Blip and maintains it, and ${people.length - 1} contributors.</p>
<ul class="people">
${cards}
</ul>
<p class="note">Also thanks to the people whose issues changed the code: ${issues}.</p>
<p class="note">Pull requests and commits are from GitHub, ${longDate(d.fetched)}. Bots are left out. An X link appears only where the project's CONTRIBUTORS-X.md lists one.</p>
</div>
</section>
`
}

function quotesHtml(q: { quotes: Quote[] }) {
  const items = q.quotes
    .map(
      (x) => `<li>
<figure class="quote">
<blockquote><p>\u201c${x.partial ? '\u2026' : ''}${esc(x.text)}${x.partial && !/[.!?]$/.test(x.text) ? '\u2026' : ''}\u201d</p></blockquote>
<figcaption>${esc(x.name)} · <a href="https://x.com/${encodeURIComponent(x.handle)}/status/${x.id}">@${esc(x.handle)} on X</a></figcaption>
</figure>
</li>`,
    )
    .join('\n')
  return `<section class="sec" id="praise">
<div class="wrap">
<h2>What people say</h2>
<p>${esc(C.QUOTES_INTRO)}</p>
<ul class="quotes" tabindex="0" aria-label="Posts about Blip, swipe to see more">
${items}
</ul>
</div>
</section>
`
}

function contributorsMd(d: ContributorData, notes: Notes) {
  const people = sortedPeople(d)
  const abs = (t: string) =>
    plain(t).replace(/#(\d+)/g, (_, n) => `[#${n}](${SITE.repo}/pull/${n})`)
  return people
    .map((p) => {
      const n = notes.people[p.login]
      return `- **${n?.name ?? p.login}** ([@${p.login}](${GH}/${p.login})${p.x ? `, [X @${p.x}](https://x.com/${p.x})` : ''}): ${abs(writeup(p, notes))}`
    })
    .join('\n')
}

/* ----------------------------------------------------------------- html */
function head(o: { title: string; desc: string; path: string; index: boolean }) {
  const url = SITE.origin + o.path
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta name="theme-color" content="#0C0C0C">
<meta name="color-scheme" content="dark">
${o.index ? '' : '<meta name="robots" content="noindex">\n'}<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Blip">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.origin}/blip-og.png">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="640">
<meta property="og:image:alt" content="Blip app window with demo data next to the line: iMessage. On Linux. For real.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="twitter:image" content="${SITE.origin}/blip-og.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${o.index ? `<link rel="alternate" type="text/markdown" href="/index.md">\n` : ''}<link rel="preload" href="/fonts/kanit-500.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${A('site.css')}">
<script src="${A('site.js')}" defer></script>
</head>
`
}

const header = `<a class="skip" href="#main">Skip to content</a>
<header>
<div class="wrap bar-in">
<a class="logo" href="${SITE.home}" aria-label="nixfred, home"><img src="/nixfred-logo.svg" width="114" height="44" alt=""></a>
<nav class="nav" aria-label="Primary">
<a href="/#install">Install</a>
<a href="/#features">Features</a>
<a href="${SITE.repo}">GitHub</a>
</nav>
</div>
</header>
`

const footer = `<footer class="foot">
<div class="wrap">
<a class="foot-link" href="${SITE.home}">nixfred.com</a>
<p>Fred Nix, Atlanta, GA${SITE.email ? ` · <a href="mailto:${SITE.email}">${SITE.email}</a>` : ''}</p>
<p>Blip is open source under the MIT license. <a href="${SITE.repo}">Source on GitHub</a>.</p>
</div>
</footer>
`

function installHtml() {
  return C.INSTALL_LINES.map((l) => {
    const i = l.indexOf('#')
    return i < 0 ? esc(l) : `${esc(l.slice(0, i))}<span class="cm">${esc(l.slice(i))}</span>`
  }).join('\n')
}

function indexHtml(s: Stats, contrib: ContributorData, notes: Notes, quotes: { quotes: Quote[] }) {
  const date = longDate(s.fetched)
  const nf = new Intl.NumberFormat('en-US')
  const cards = C.FEATURES.map(
    (f) => `<li class="card">
<span class="tag">${esc(f.tag)}</span>
<h3>${esc(f.title)}</h3>
<p class="long">${esc(f.body)}</p>
<p class="short">${esc(f.short)}</p>
</li>`,
  ).join('\n')
  const scenes = C.SCENES.map(
    (c) => `<li>
<figure class="shot">
<div class="frame"><img src="${A(c.file)}" width="2000" height="1250" loading="lazy" decoding="async" alt="${esc(c.alt)}"></div>
<figcaption><strong>${esc(c.title)}.</strong> ${esc(c.caption)}</figcaption>
</figure>
</li>`,
  ).join('\n')
  return (
    head({ title: SITE.title, desc: SITE.description, path: '/', index: true }) +
    `<body>
${header}<main id="main">
<section class="hero">
<div class="wrap hero-in">
<p class="eyebrow">Omarchy bar widget</p>
<h1>Blip</h1>
<p class="lead">${esc(C.TAGLINE)}</p>
<p class="sub">${esc(C.SUB)}</p>
<div class="links">
<a class="btn btn-primary" href="${SITE.repo}">View on GitHub</a>
<a class="btn btn-ghost" href="${SITE.home}">Back to nixfred.com</a>
<a class="link-quiet" href="#install">Install</a>
</div>
</div>
<div class="wrap hero-shot">
<figure class="shot">
<div class="frame"><img src="${A('blip-showcase.webp')}" width="1636" height="1149" fetchpriority="high" decoding="async" alt="${esc(C.SHOWCASE_ALT)}"></div>
<figcaption><strong>Demo data.</strong> ${esc(C.SHOWCASE_CAPTION.replace(/^Demo data\. /, ''))}</figcaption>
</figure>
</div>
</section>

<section class="sec" id="install">
<div class="wrap">
<h2>Install</h2>
<div class="callout" role="note">
<p class="callout-t">${esc(C.MAC_CALLOUT_TITLE)}</p>
<p>${esc(C.MAC_CALLOUT)}</p>
</div>
<p>${esc(C.INSTALL_INTRO)}</p>
<div class="code">
<pre><code id="install-code">${installHtml()}</code></pre>
<button class="copy" id="copy-install" type="button" aria-label="Copy the install commands">Copy</button>
</div>
<p class="lbl">Requirements</p>
<ul class="reqs" id="install-reqs">
${C.REQUIREMENTS.map((r) => `<li>${esc(r)}</li>`).join('\n')}
</ul>
<p class="note">${esc(C.REQUIREMENTS_OPTIONAL)}</p>
<p class="note">${esc(C.INSTALL_NOTE)}</p>
<p class="note">${esc(C.INSTALL_NOTE_2)}</p>
<p class="note">${esc(C.AWAKE_NOTE)}</p>
</div>
</section>

<section class="sec" id="demo">
<div class="wrap">
<h2>What it looks like</h2>
<ul class="scenes">
${scenes}
</ul>
<p class="note">${esc(C.DEMO_CAPTION)}</p>
</div>
</section>

<section class="sec" id="features">
<div class="wrap">
<h2>Features</h2>
<ul class="grid">
${cards}
</ul>
<p class="note">${esc(C.CANT_DO)}</p>
</div>
</section>

${quotesHtml(quotes)}
${contributorsHtml(contrib, notes)}
<section class="sec" id="stats">
<div class="wrap">
<h2>On GitHub</h2>
<ul class="stats">
<li><b>${nf.format(s.stars)}</b> stars</li>
<li><b>${nf.format(s.forks)}</b> forks</li>
<li><b>${nf.format(contrib.people.length)}</b> contributors</li>
<li>MIT license</li>
</ul>
<p class="note">Star and fork counts are from GitHub, ${date}. Contributors are the people listed above.</p>
</div>
</section>

<section class="sec" id="more">
<div class="wrap">
<h2>Part of nixfred.com</h2>
<p class="back"><span>Blip is one of Fred Nix's projects.</span> <a class="ul-link" href="${SITE.home}">See the rest at nixfred.com</a></p>
</div>
</section>
</main>
${footer}<noscript><!-- Everything on this page is plain HTML. JavaScript only adds the Copy button. --></noscript>
</body>
</html>
`
  )
}

function notFoundHtml() {
  return (
    head({ title: 'Page not found | Blip', desc: 'That page does not exist.', path: '/404.html', index: false }) +
    `<body>
${header}<main id="main" class="nf">
<div class="wrap hero-in">
<p class="eyebrow">404</p>
<h1>Page not found</h1>
<p class="lead">That page does not exist.</p>
<div class="links">
<a class="btn btn-primary" href="/">Blip home</a>
<a class="btn btn-ghost" href="${SITE.home}">Back to nixfred.com</a>
</div>
</div>
</main>
${footer}</body>
</html>
`
  )
}

/* ------------------------------------------------------------- markdown */
function indexMd(s: Stats, contrib: ContributorData, notes: Notes, quotes: { quotes: Quote[] }) {
  return `# Blip

${C.TAGLINE}

${C.SUB}

- Source: ${SITE.repo}
- Site: ${SITE.origin}/
- Back to nixfred.com: ${SITE.home}

## Install

**${C.MAC_CALLOUT_TITLE}** ${C.MAC_CALLOUT}

${C.INSTALL_INTRO}

\`\`\`sh
${C.INSTALL}
\`\`\`

Requirements:

${C.REQUIREMENTS.map((r) => `- ${r}`).join('\n')}

${C.REQUIREMENTS_OPTIONAL}

${C.INSTALL_NOTE}

${C.INSTALL_NOTE_2}

${C.AWAKE_NOTE}

## What it looks like

![${C.SHOWCASE_ALT}](${SITE.origin}${A('blip-showcase.webp')})

${C.SHOWCASE_CAPTION}

${C.SCENES.map((c) => `![${c.alt}](${SITE.origin}${A(c.file)})\n\n**${c.title}.** ${c.caption}`).join('\n\n')}

${C.DEMO_CAPTION}

## Features

${C.FEATURES.map((f) => `### ${f.title}\n\n${f.body}`).join('\n\n')}

${C.CANT_DO}

## What people say

${C.QUOTES_INTRO}

${quotes.quotes.map((x) => `> ${x.partial ? '…' : ''}${x.text}${x.partial && !/[.!?]$/.test(x.text) ? '…' : ''}\n>\n> ${x.name}, [@${x.handle} on X](https://x.com/${x.handle}/status/${x.id})`).join('\n\n')}

## Contributors

${C.CONTRIB_INTRO}

${contrib.people.length} people: Fred Nix, who wrote Blip and maintains it, and ${contrib.people.length - 1} contributors.

${contributorsMd(contrib, notes)}

Also thanks to the people whose issues changed the code: ${notes.issues.map((i) => `[${i.name}](${GH}/${i.login}) (${plain(i.what)})`).join(', ')}.

Pull requests and commits are from GitHub, ${longDate(contrib.fetched)}. Bots are left out.

## On GitHub

${s.stars} stars, ${s.forks} forks, ${contrib.people.length} contributors. MIT license.

Star and fork counts are from GitHub, ${longDate(s.fetched)}. Contributors are the people listed above.

## Part of nixfred.com

Blip is one of Fred Nix's projects. See the rest at ${SITE.home}

---

nixfred.com: ${SITE.home}
Fred Nix, Atlanta, GA${SITE.email ? `, ${SITE.email}` : ''}
`
}

/* --------------------------------------------------------------- skills */
function renderSkills() {
  const dir = join(SRC, 'skills')
  const vars: Record<string, string> = {
    REPO: SITE.repo,
    ORIGIN: SITE.origin,
    INSTALL: C.INSTALL,
    INSTALL_NOTE: C.INSTALL_NOTE,
    INSTALL_NOTE_2: C.INSTALL_NOTE_2,
    AWAKE_NOTE: C.AWAKE_NOTE,
    MAC_CALLOUT: C.MAC_CALLOUT,
    REQUIREMENTS: C.REQUIREMENTS.map((r) => `- ${r}`).join('\n'),
    REQUIREMENTS_OPTIONAL: C.REQUIREMENTS_OPTIONAL,
  }
  const skills: { name: string; type: 'skill-md'; description: string; url: string; digest: string }[] = []
  for (const name of readdirSync(dir).sort()) {
    if (!statSync(join(dir, name)).isDirectory()) continue
    const raw = readFileSync(join(dir, name, 'SKILL.md'), 'utf8')
    const out = raw.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      if (!(k in vars)) throw new Error(`unknown placeholder ${k} in ${name}/SKILL.md`)
      return vars[k]
    })
    const fm = out.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/)
    if (!fm || fm[1] !== name) throw new Error(`bad frontmatter in ${name}/SKILL.md`)
    const target = join(DIST, '.well-known', 'agent-skills', name)
    mkdirSync(target, { recursive: true })
    writeFileSync(join(target, 'SKILL.md'), out)
    skills.push({
      name,
      type: 'skill-md',
      description: fm[2],
      url: `${SITE.origin}/.well-known/agent-skills/${name}/SKILL.md`,
      digest: `sha256:${sha256(out)}`,
    })
  }
  if (!skills.length) throw new Error('no skills found')
  const index = { $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json', skills }
  writeFileSync(join(DIST, '.well-known', 'agent-skills', 'index.json'), JSON.stringify(index, null, 2) + '\n')
  // every folder in dist/.well-known/agent-skills must be listed
  const listed = new Set(skills.map((x) => x.name))
  for (const d of readdirSync(join(DIST, '.well-known', 'agent-skills'))) {
    if (statSync(join(DIST, '.well-known', 'agent-skills', d)).isDirectory() && !listed.has(d)) throw new Error(`unlisted skill ${d}`)
  }
}

/* ----------------------------------------------------------------- main */
const statsOnly = process.argv.includes('--stats-only')
const stats = await loadStats()
if (statsOnly) process.exit(0)
const contrib = await loadContributors(SITE.repoSlug, nyDate())
const notes = readJson<Notes>('contributor-notes.json')
const quotes = readJson<{ quotes: Quote[] }>('quotes.json')
await checkReadme()

rmSync(DIST, { recursive: true, force: true })
mkdirSync(join(DIST, 'assets'), { recursive: true })
const PUB_ASSETS = join(SRC, 'public', 'assets')
cpSync(join(SRC, 'public'), DIST, { recursive: true, filter: (p) => p !== PUB_ASSETS })
mkdirSync(join(DIST, 'assets'), { recursive: true })

for (const f of ['site.css', 'site.js']) emitAsset(f, readFileSync(join(SRC, f)))
for (const f of readdirSync(PUB_ASSETS)) emitAsset(f, readFileSync(join(PUB_ASSETS, f)))
for (const f of readdirSync(AVATARS)) emitAsset('av-' + f, readFileSync(join(AVATARS, f)))

writeFileSync(join(DIST, 'index.html'), indexHtml(stats, contrib, notes, quotes))
writeFileSync(join(DIST, '404.html'), notFoundHtml())
writeFileSync(join(DIST, 'index.md'), indexMd(stats, contrib, notes, quotes))
writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *\nContent-Signal: ai-train=no, search=yes, ai-input=yes\nAllow: /\n\nSitemap: ${SITE.origin}/sitemap.xml\n`,
)
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE.origin}/</loc>\n    <lastmod>${stats.fetched}</lastmod>\n  </url>\n</urlset>\n`,
)
writeFileSync(
  join(DIST, '_headers'),
  `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/
  Link: </.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"
  Link: </.well-known/agent-skills/install-blip/SKILL.md>; rel="service-doc"; type="text/markdown"
  Link: </index.md>; rel="alternate"; type="text/markdown"

/.well-known/*
  Access-Control-Allow-Origin: *

/.well-known/agent-skills/index.json
  Content-Type: application/json; charset=utf-8

/.well-known/agent-skills/*/SKILL.md
  Content-Type: text/markdown; charset=utf-8

/index.md
  Content-Type: text/markdown; charset=utf-8
`,
)
renderSkills()
console.log('built dist/ ·', stats.stars, 'stars,', stats.forks, 'forks,', stats.contributors, 'contributors, fetched', stats.fetched)
