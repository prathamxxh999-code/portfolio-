# Design City

Original Vice City-inspired design arcade, integrated into the existing retro Windows desktop. The portfolio branding, portrait and project order are preserved.

## Visual assets

- `loading-art-source.png`: generated with the built-in image generation tool; exported as `src/game-assets/design-city-story.webp` and a cropped desktop cover.
- Prompt: A wide hand-inked early-2000s Miami game-cover illustration with thick black outlines and airbrushed cel shading; young creative director with glasses at a cream CRT in a balcony studio; pink sunset, palms, teal waterfront, sports car and mouse close-up arranged in four diagonal comic panels. No text, official characters or game logos.
- Changa One, Anton and Yellowtail are self-hosted. Included font licenses are in `src/game-assets/`. No unlicensed GTA font files, soundtrack or copied game assets.
- Grey angled camouflage panel is an original static SVG; the cursor is an original 32px PNG. Motion uses transforms/opacity and respects reduced-motion settings.

## Game and records

Name entry -> 3.8-second skippable story -> 30-second colour or alignment challenge -> results. Wrong picks cost 2 seconds. Grid grows from 3x3 to 5x5. Keyboard navigation, pause/resume, auto pause on hiding, silent outside the game.

Original Web Audio synth loop, menu, correct/wrong and result effects. Sound starts off, can be toggled at any point, and preferences persist. No external audio requests.

Player records are local only, as requested. Create/select profiles, rename, view separate rankings per challenge, inspect past runs, delete individual runs or a profile after an inline confirmation. Up to 50 profiles and 500 recent runs. Browser-storage errors fall back to a clearly labeled session-only mode. These records are neither verified results nor sitewide footfall analytics. No server or third-party account was provisioned.

Checks: `node scripts/check-design-game.mjs`, `node scripts/check-pc-desktop.mjs`, `node scripts/check-assets.mjs`, plus desktop/mobile browser verification.
