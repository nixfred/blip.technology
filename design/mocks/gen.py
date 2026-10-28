#!/usr/bin/env python3
"""Writes the demo mock pages (HTML) next to this file. Run render.py to make PNG/WebP."""
import pathlib
D = pathlib.Path(__file__).parent

HEAD = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{t}</title><link rel="stylesheet" href="mock.css"></head><body>'

def lake(w, h, uid='a'):
    return f'''<svg width="{w}" height="{h}" viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="s{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f93c4"/><stop offset=".55" stop-color="#d9a98a"/><stop offset="1" stop-color="#f1c79a"/></linearGradient>
<linearGradient id="l{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8aa2b8"/><stop offset="1" stop-color="#2f4558"/></linearGradient>
<radialGradient id="g{uid}"><stop offset="0" stop-color="#fff3d6"/><stop offset=".35" stop-color="#ffe2b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd29a" stop-opacity="0"/></radialGradient></defs>
<rect width="240" height="150" fill="url(#s{uid})"/>
<circle cx="168" cy="62" r="34" fill="url(#g{uid})"/><circle cx="168" cy="62" r="8" fill="#fff6e0"/>
<path d="M0 88 L34 66 L58 80 L96 52 L132 82 L160 70 L200 90 L240 74 L240 96 L0 96Z" fill="#6b7f9a"/>
<path d="M0 96 L30 84 L70 94 L112 78 L150 94 L196 82 L240 96 L240 100 L0 100Z" fill="#41566f"/>
<rect y="96" width="240" height="54" fill="url(#l{uid})"/>
<path d="M0 96 L30 108 L70 98 L112 114 L150 98 L196 110 L240 96 L240 100 L0 100Z" fill="#2b3f56" opacity=".55"/>
<ellipse cx="168" cy="108" rx="26" ry="3.4" fill="#ffe2b0" opacity=".55"/><ellipse cx="168" cy="118" rx="16" ry="2.2" fill="#ffe2b0" opacity=".3"/>
<path d="M0 100 L0 94 L8 88 L14 96 L22 86 L30 97 L38 90 L46 100Z M190 100 L196 90 L204 98 L212 86 L220 97 L228 89 L240 95 L240 100Z" fill="#1e2d3b"/>
</svg>'''

def trailmap(w, h):
    rings = ''.join(f'<ellipse cx="{120+i*2}" cy="{70-i*1}" rx="{22+i*17}" ry="{14+i*10}" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="1" transform="rotate(-14 120 70)"/>' for i in range(7))
    return f'''<svg width="{w}" height="{h}" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c3b2e"/><stop offset="1" stop-color="#2f6048"/></linearGradient></defs>
<rect width="240" height="120" fill="url(#m)"/>{rings}
<path d="M44 92 C 62 70, 80 84, 98 62 S 138 40, 150 54 S 190 66, 200 38" fill="none" stroke="#ffa24a" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 5.5"/>
<circle cx="44" cy="92" r="4.2" fill="#fff"/><circle cx="44" cy="92" r="2" fill="#2f6048"/>
<circle cx="200" cy="38" r="4.2" fill="#ffa24a"/><circle cx="200" cy="38" r="1.8" fill="#fff"/>
</svg>'''

def tile(img, name, dot=False, sel=False):
    return f'<div class="tile{" sel" if sel else ""}">{"<i class=dot></i>" if dot else ""}<img src="img/{img}.png" alt=""><span>{name}</span></div>'

def row(av, name, time, pv, dot=False, sel=False, hashav=False):
    a = '<div class="av hash">#</div>' if hashav else f'<img class="av" src="img/{av}.png" alt="">'
    return f'<div class="row{" sel" if sel else ""}">{"<i class=dot></i>" if dot else ""}{a}<div class="tx"><div class="top"><span class="nm">{name}</span><span class="tm">{time}</span></div><div class="pv">{pv}</div></div></div>'

THREADS = [
    ('', '31614', '7:11 AM', 'Your order has been delivered. Left at the front door.', dict(hashav=True)),
    ('noa', 'Noa Lindqvist', '2:20 AM', 'did you ever hear back about the quote', {}),
    ('marisol', 'Marisol Vega', '12:46 AM', 'yes! saturday works', {}),
    ('theo', 'Theo Brandt', 'Yesterday', 'no rush, whenever you get a sec', {}),
    ('ines', 'Ines Castellanos', 'Yesterday', 'that place closed, try the one on 5th', {}),
    ('owen', 'Owen Park', 'Yesterday', 'ok I found it, it was in the car', {}),
]

def sidebar(sel_tile=None, status='ALL CAUGHT UP'):
    names = [('becky', 'Becky Smith'), ('trail', 'Trail Crew'), ('priya', 'Priya Raman'), ('dana', 'Dana Whitfield'), ('book', 'Book Club'), ('sam', 'Sam Okafor')]
    t = ''.join(tile(i, n, sel=(i == sel_tile)) for i, n in names)
    r = ''.join(row(a, n, tm, pv, **kw) for a, n, tm, pv, kw in THREADS)
    return f'''<div class="side"><div class="brand"><div><b>Blip</b><small>{status}</small></div><i>2.6.2</i></div>
<div class="lbl">MESSAGES</div><div class="search">name or message</div>
<div class="tiles">{t}</div><div class="rows">{r}</div></div>'''

def compose(focus=False):
    return f'<div class="compose"><div class="in{" caret" if focus else ""}">{"" if focus else "iMessage"}</div><div class="send">&#8593;</div></div>'

# ---------------------------------------------------------------- b: group chat
def group():
    msgs = f'''<div class="msgs">
<div class="run"><div class="who">Sam Okafor</div><div class="b">trailhead at 7 still works for everyone?</div><div class="ts">6:02 PM</div></div>
<div class="run"><div class="who">Priya Raman</div><div class="b">yes! bringing the good thermos<span class="tap">&#128077;</span></div><div class="ts">6:04 PM</div></div>
<div class="run"><div class="who">Dana Whitfield</div><div class="photo"><div class="clip">{lake(232, 132, 'g')}</div><span class="tap">&#10084;&#65039;</span></div><div class="b" style="margin-top:4px">sunrise from the ridge last week</div><div class="ts">6:07 PM</div></div>
<div class="run"><div class="who">Becky Smith</div><div class="b">bringing the snacks</div><div class="ts">6:08 PM</div></div>
<div class="run me"><div class="b">I'll drive, room for four<span class="tap">&#128514;</span></div><div class="ts">6:09 PM</div><div class="rd">Read 6:12 PM</div></div>
</div>'''
    return f'''{HEAD.format(t='Group chat')}<div class="win">{sidebar('trail')}
<div class="pane"><div class="hd"><b>Trail Crew</b><small>Becky Smith, Dana Whitfield, Priya Raman, Sam Okafor</small><i class="plus"></i></div>{msgs}{compose()}</div></div></body></html>'''

# ---------------------------------------------------------------- d: share sheet
def share():
    msgs = f'''<div class="msgs">
<div class="run"><div class="b">this is the route for Saturday</div><div class="ts">9:14 AM</div></div>
<div class="run"><div class="lc">{trailmap(232, 112)}<div class="meta"><b>Ridge Loop trail map</b><span>example.com</span></div></div><div class="ts">9:14 AM</div></div>
<div class="run me"><div class="b">nice, sending it to my phone</div><div class="ts">9:16 AM</div><div class="rd">Read 9:16 AM</div></div>
</div>'''
    sheet = f'''<div class="dim"></div><svg class="cursor" style="left:470px;top:262px" width="18" height="24" viewBox="0 0 18 24"><path d="M2 1.5v17l4.6-4.2 3 6.8 3-1.4-3-6.7h6.2z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg><div class="sheet" style="left:556px;margin-left:0"><div class="k">SHARE LINK</div><h4>example.com</h4><div class="u">https://example.com/ridge-loop</div>
<div class="qr"><img src="img/qr.svg" alt=""></div>
<div class="btn on">Open in browser</div><div class="btn">Copy link</div><div class="btn">Send to a device &nbsp;&middot;&nbsp; LocalSend</div>
<div class="hint">1 2 3 or &#8593;&#8595; Enter &nbsp;&middot;&nbsp; Esc closes</div></div>'''
    return f'''{HEAD.format(t='Share sheet')}<div class="win">{sidebar('sam')}
<div class="pane"><div class="hd"><b>Sam Okafor</b><small>sam.okafor@example.com</small><i class="plus"></i></div>{msgs}{compose()}</div>{sheet}</div></body></html>'''

# ---------------------------------------------------------------- a: bar popout
BAR_SVG = '<svg width="18" height="16" viewBox="0 0 18 16" fill="none" stroke="#e6e9ec" stroke-width="1.4" stroke-linejoin="round"><path d="M2 2.5h14v8.5H8.5L5 14.2V11H2z"/></svg>'
WIFI = '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#aab1b7" stroke-width="1.4" stroke-linecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M3.8 6.8a6.2 6.2 0 0 1 8.4 0M6.1 9.3a3 3 0 0 1 3.8 0"/><circle cx="8" cy="10.6" r=".6" fill="#aab1b7"/></svg>'
BATT = '<span style="display:flex;align-items:center;gap:5px"><svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x=".7" y=".7" width="18" height="9.6" rx="2.2" stroke="#aab1b7" stroke-width="1.3"/><rect x="2.4" y="2.4" width="12.4" height="6.2" rx="1" fill="#aab1b7"/><rect x="19.8" y="3.6" width="1.6" height="3.8" rx=".8" fill="#aab1b7"/></svg><span>86%</span></span>'
def bar(n, clock='Wed 9:41 AM'):
    return f'''<div class="bar"><div class="ws"><span class="on">1</span><span>2</span><span>3</span><span>4</span><span>5</span></div><div class="clk">{clock}</div>
<div class="tray">{WIFI}{BATT}<div class="blipicon">{BAR_SVG}<span class="badge">{n}</span></div></div></div>'''

TERM_FULL = '''<span class="m">~/code/trail-app main $</span> <span class="w">bun test</span>
<span class="m">bun test v1.3.0</span>

 <span class="g">&#10003;</span> routes &gt; loads the gpx file <span class="m">[3.1ms]</span>
 <span class="g">&#10003;</span> routes &gt; builds the elevation profile <span class="m">[1.8ms]</span>
 <span class="g">&#10003;</span> map &gt; clusters nearby pins <span class="m">[4.4ms]</span>
 <span class="g">&#10003;</span> share &gt; makes a stable link <span class="m">[0.9ms]</span>
 <span class="g">&#10003;</span> weather &gt; falls back offline <span class="m">[2.6ms]</span>
 <span class="g">&#10003;</span> export &gt; writes a tidy csv <span class="m">[1.2ms]</span>

 <span class="g">48 pass</span>
 0 fail
<span class="m">Ran 48 tests across 9 files. [412ms]</span>

<span class="m">~/code/trail-app main $</span> <span class="w">&#9608;</span>'''

TERM_S = '''<span class="m">~/code/trail-app main $</span> <span class="w">bun test</span>
<span class="g">&#10003;</span> 6 suites <span class="m">[412ms]</span>
<span class="g">48 pass</span>, 0 fail
<span class="m">Ran 48 tests across 9 files.</span>
<span class="m">~/code/trail-app main $</span> <span class="w">&#9608;</span>'''

def popout():
    tiles = ''.join([tile('becky', 'Becky Smith'), tile('trail', 'Trail Crew', dot=True), tile('priya', 'Priya Raman', dot=True),
                     tile('dana', 'Dana Whitfield'), tile('book', 'Book Club'), tile('sam', 'Sam Okafor')])
    rows = ''.join([
        row('', '31614', '7:11 AM', 'Your order has been delivered.', dot=True, hashav=True),
        row('noa', 'Noa Lindqvist', '2:20 AM', 'did you ever hear back about the quote'),
        row('marisol', 'Marisol Vega', '12:46 AM', 'yes! saturday works', dot=True),
        row('theo', 'Theo Brandt', 'Yesterday', 'no rush, whenever you get a sec'),
        row('ines', 'Ines Castellanos', 'Yesterday', 'that place closed, try the one on 5th'),
        row('owen', 'Owen Park', 'Yesterday', 'ok I found it, it was in the car'),
    ])
    return f'''<div class="panel"><div class="brand"><div><b>Blip</b><small>4 UNREAD</small></div><i>2.6.2</i></div>
<div class="lbl" style="margin-top:12px"><span>MESSAGES</span><span class="hdr-btns"><span class="ib">+</span><span class="ib">&#8689;</span></span></div>
<div class="search">name or message</div><div class="tiles">{tiles}</div><div class="rows">{rows}</div></div>'''

def barpage():
    return f'''{HEAD.format(t='Bar popout')}{bar(4)}
<div class="term" style="left:14px;top:42px;width:600px;height:372px"><span class="m">trail-app/src/share.ts</span>

{CODE}</div>
<div class="term" style="left:14px;top:422px;width:600px;height:189px">{TERM_S}</div>{popout()}</body></html>'''

# ---------------------------------------------------------------- c: toast
CODE_SHORT = '''<span class="m"> 1</span>  <span class="b2">export</span> <span class="w">function</span> <span class="g">shareLink</span>(route) {
<span class="m"> 2</span>    <span class="b2">const</span> id = hash(route.points)
<span class="m"> 3</span>    <span class="b2">return</span> `https://example.com/${id}`
<span class="m"> 4</span>  }
<span class="m"> 5</span>
<span class="m"> 6</span>  <span class="b2">export</span> <span class="w">function</span> <span class="g">loopLength</span>(route) {
<span class="m"> 7</span>    <span class="b2">return</span> route.segments
<span class="m"> 8</span>      .map((s) =&gt; s.meters)
<span class="m"> 9</span>      .reduce((a, b) =&gt; a + b, 0)
<span class="m">10</span>  }'''

CODE = '''<span class="m">  1</span>  <span class="b2">import</span> { hash } <span class="b2">from</span> <span class="g">'./hash'</span>
<span class="m">  2</span>  <span class="b2">import type</span> { Route } <span class="b2">from</span> <span class="g">'./types'</span>
<span class="m">  3</span>
<span class="m">  4</span>  <span class="b2">export function</span> <span class="w">shareLink</span>(route: Route) {
<span class="m">  5</span>    <span class="b2">const</span> id = hash(route.points)
<span class="m">  6</span>    <span class="b2">return</span> <span class="g">`https://example.com/${id}`</span>
<span class="m">  7</span>  }
<span class="m">  8</span>
<span class="m">  9</span>  <span class="b2">export function</span> <span class="w">loopLength</span>(route: Route) {
<span class="m"> 10</span>    <span class="b2">return</span> route.segments
<span class="m"> 11</span>      .map((s) =&gt; s.meters)
<span class="m"> 12</span>      .reduce((a, b) =&gt; a + b, 0)
<span class="m"> 13</span>  }
<span class="m"> 14</span>
<span class="m"> 15</span>  <span class="b2">export function</span> <span class="w">elevationGain</span>(route: Route) {
<span class="m"> 16</span>    <span class="b2">let</span> gain = 0
<span class="m"> 17</span>    <span class="b2">for</span> (<span class="b2">let</span> i = 1; i &lt; route.points.length; i++) {
<span class="m"> 18</span>      <span class="b2">const</span> d = route.points[i].ele - route.points[i - 1].ele
<span class="m"> 19</span>      <span class="b2">if</span> (d &gt; 0) gain += d
<span class="m"> 20</span>    }
<span class="m"> 21</span>    <span class="b2">return</span> Math.round(gain)
<span class="m"> 22</span>  }
<span class="m"> 23</span>
<span class="m"> 24</span>  <span class="b2">export function</span> <span class="w">summary</span>(route: Route) {
<span class="m"> 25</span>    <span class="b2">return</span> <span class="g">`${loopLength(route)} m, ${elevationGain(route)} m up`</span>
<span class="m"> 26</span>  }'''

GITLOG = '''<span class="m">~/code/trail-app main $</span> <span class="w">git log --oneline -6</span>
<span class="b2">e41c9a2</span> add share link for routes
<span class="b2">b07d3f8</span> cluster nearby pins on the map
<span class="b2">93a1e60</span> offline weather fallback
<span class="b2">5cd7b14</span> tidy csv export
<span class="b2">18fe0a7</span> elevation profile from gpx
<span class="b2">0a6c2d9</span> first commit
<span class="m">~/code/trail-app main $</span> <span class="w">&#9608;</span>'''

CURSOR = '<svg class="cursor" style="left:{x}px;top:{y}px" width="18" height="24" viewBox="0 0 18 24"><path d="M2 1.5v17l4.6-4.2 3 6.8 3-1.4-3-6.7h6.2z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>'

def toastpage():
    t1 = '''<div class="toast" style="top:44px"><div class="ic"><i></i></div><div style="flex:1"><div class="app"><span>BLIP</span><span>now</span></div><div class="t">Priya Raman</div><div class="bd">are we still on for Friday? I can pick up the permits</div></div></div>'''
    t2 = '''<div class="toast" style="top:140px"><div class="ic"><i></i></div><div style="flex:1"><div class="app"><span>BLIP</span><span>1m ago</span></div><div class="t">Trail Crew</div><div class="bd">Sam Okafor: trailhead at 7 works for me</div></div></div>'''
    return f'''{HEAD.format(t='Toast')}{bar(2)}
<div class="term" style="left:14px;top:42px;width:482px;height:569px"><span class="m">trail-app/src/share.ts</span>

{CODE}</div>
<div class="term" style="left:504px;top:42px;width:482px;height:283px">{TERM_FULL}</div>
<div class="term" style="left:504px;top:333px;width:482px;height:278px">{GITLOG}</div>{t1}{t2}{CURSOR.format(x=880, y=118)}</body></html>'''

(D / 'bar-popout.html').write_text(barpage())
(D / 'group-chat.html').write_text(group())
(D / 'toast.html').write_text(toastpage())
(D / 'share-sheet.html').write_text(share())
print('wrote html')
