# Prathamesh Phadatare — Portfolio

Source code for [Prathamesh's product design portfolio](https://prathameshux.vercel.app/).

## Project files

- `src/index.html` — page structure and content
- `src/styles.css` — layout, responsive styling, and animation
- `src/app.js` — navigation, projects, scrolling, and interactions
- `src/mockups.js` — project screen mockups
- `src/portfolio-bot.js` — portfolio bot responses (the bot is currently hidden)
- `src/hero-original.webp` — original hero photo
- `src/hero-original-clean.webp` — original photo with the repaired hair matte
- `src/project-showcases.js` and `.css` — CashBell and CRM project presentations
- `src/reference-showcase.js`, `.css` and `reference-assets.js` — four banking galleries and the credited banner/poster reference collection
- `src/retro-intro.js` and `.css` — room greeting and black-screen entry transition
- `src/pc-desktop.js` and `.css` — classic desktop, folders, résumé viewer and restart
- `src/project-folders.css` — horizontal gallery with framed folder titles
- `src/intro/` — desktop assets, local terminal font and desktop/mobile room loops
- `src/showcases/` — silent product films, posters and real project screens
- `scripts/showcase-sources/` — source clips, assets, licensing and reproduction notes
- `scripts/render-cashbell-motion.py` and `render-crm-reference.py` — editable film timelines
- `scripts/render-reference-heroes.py` — photographic device compositions using the original banking screens
- `scripts/render-pc-room.py` and `install-room-art.py` — editable room motion and framed wall art
- `scripts/prepare-window-video.py` and `replace-window-video.py` — masked outside-window video updates
- `src/mini-pratham.png` — bot artwork
- `dist/` — generated static site ready to publish
- `.openai/hosting.json` — Sites hosting configuration

## Run locally

Use Node.js 20 or newer. There are no package dependencies.

```bash
npm run dev
```

Open `http://127.0.0.1:8765`. Edit files in `src/` and refresh the page.

## Build

```bash
npm run build
```

The build copies `src/` into `dist/`. Commit both source and generated output when publishing changes.

Vercel uses `dist/` as its output directory through `vercel.json`.

Check folder navigation, cancellation, résumé controls and built asset references:

```bash
node scripts/check-pc-desktop.mjs
node scripts/check-assets.mjs
```

The asset check runs against `dist/`, so build before running it.

## Design City desktop game

The retro desktop includes a Design Game shortcut directly below Portfolio. It opens an original Vice City-inspired visual arcade: separate name and mission screens, looping setup video, a short road-video intro, three design missions, original synthwave BGM, sound on/off, and local player records. UI repair, layout parking and dark-pattern patrol use six wanted stars as design debt. Gameplay fits the app surface without page scrolling. Scores are local to this browser, as requested; they are not sitewide footfall analytics. See scripts/showcase-sources/design-city/BRIEF.md for sources and behavior.

## Valet Parking

Project 7 uses all 17 original Figma screens. A static hero uses the same photographic phone hardware as CashBell. The grouped gallery explains each screen, supports scrolling through long forms inside each phone, and links to full-resolution images. No video or generated interfaces. Source exports and the reproducible renderer are included.
