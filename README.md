# Prathamesh Phadatare — Portfolio

Source code for [Prathamesh's product design portfolio](https://prathamesh-portfolio.chetan-patil767378.chatgpt.site/).

## Project files

- `src/index.html` — page structure and content
- `src/styles.css` — layout, responsive styling, and animation
- `src/app.js` — navigation, projects, scrolling, and interactions
- `src/mockups.js` — project screen mockups
- `src/portfolio-bot.js` — portfolio bot responses (the bot is currently hidden)
- `src/hero-original.webp` — original hero photo
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
