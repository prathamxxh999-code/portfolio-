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
- `src/showcases/` — silent product films, posters and real project screens
- `scripts/showcase-sources/` — source clips, assets, licensing and reproduction notes
- `scripts/render-cashbell-motion.py` and `render-crm-reference.py` — editable film timelines
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
