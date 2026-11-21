# Valet Parking showcase

Source: user's Figma file EHTtPQR6gj7jrmAtzUdiNZ, page `valet parking`, Section 2. All 17 original mobile frames are used, including state variants. The plugin exported 15 frames before its Starter-plan tool limit. Account settings (Screen 94) and Analytics (Screen 95) were exported through the signed-in normal Figma UI. No plan upgrade or paid integration was used.

Configured PDF frame exports were rasterized at 144 DPI (2x). Home and account settings use the native 360px PNG export. Original PDF/PNG sources are retained in `screens/`. No screen text, layouts, icons or branding were generated or redrawn.

Hero: static 2400x1200 desktop and 1600x1350 mobile compositions with exactly two straight, front-facing phone mockups. Home and parking-progress use their original screen proportions, uniformly resized inside the original photographic iPhone 15 Pro plate. No rotation, perspective projection, generated hardware or screen warping. The hotel valet background is retained. Same hardware source as CashBell, credited in `../devices/SOURCES.md`. No video. The full 17-screen gallery remains scrollable below with links to the full PNGs.

The page explains each screen's observable function and labels in-screen figures as sample records, not business outcomes. Role is Product Designer, without attributing the project to IDSSPL.

Build with `python scripts/render-valet-showcase.py`, then `npm run build`.

## Background asset

Built-in image generation produced `valet-background.png`; only the environment was generated. Prompt: premium photoreal wide background only, hotel valet arrival portico at blue hour, navy charcoal stone and forest-green glass, warm amber lights, dark sedan softly out of focus at rear right, key host stand at left, empty dark polished stone foreground for device compositing; full-frame 50mm architectural product photograph, real textures, restrained grade. No phones, screens, UI, text, logos, heavy fog, bloom, CGI or cyberpunk.

The final composite assets are `src/showcases/valet-hero-straight.webp` and `src/showcases/valet-hero-straight-mobile.webp`. The 17-screen gallery stays below with each screen's function.
