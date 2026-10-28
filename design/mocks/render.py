#!/usr/bin/env python3
"""Render each mock at 2x with headless Chrome via Playwright, then write PNG + WebP."""
import pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image
D = pathlib.Path(__file__).parent
OUT = D / 'out'; OUT.mkdir(exist_ok=True)
names = sys.argv[1:] or ['bar-popout', 'group-chat', 'toast', 'share-sheet']
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for n in names:
        ctx = br.new_context(viewport={'width': 1000, 'height': 625}, device_scale_factor=2)
        pg = ctx.new_page(); pg.goto((D / f'{n}.html').as_uri(), wait_until='networkidle')
        pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(200)
        pg.screenshot(path=str(OUT / f'{n}.png'))
        Image.open(OUT / f'{n}.png').convert('RGB').save(OUT / f'{n}.webp', 'WEBP', quality=84, method=6)
        ctx.close(); print(n)
    br.close()
