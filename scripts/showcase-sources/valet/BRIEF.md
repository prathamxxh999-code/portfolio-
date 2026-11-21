# Valet Parking showcase

Source: user's Figma file EHTtPQR6gj7jrmAtzUdiNZ, page `valet parking`, Section 2. All 17 original mobile frames are used, including state variants. The plugin exported 15 frames before its Starter-plan tool limit. Account settings (Screen 94) and Analytics (Screen 95) were exported through the signed-in normal Figma UI. No plan upgrade or paid integration was used.

Configured PDF frame exports were rasterized at 144 DPI (2x). Home and account settings use the native 360px PNG export. Original PDF/PNG sources are retained in `screens/`. No screen text, layouts, icons or branding were generated or redrawn.

Hero: static 2400x1200 desktop and 1600x1350 mobile compositions with three selected screens. The home screen is front and centre, overlapping the two smaller side phones. The reference-inspired angled composition uses perspective projection of the original device plate, with restrained titanium edge depth and soft shadows. The scene is a hotel valet arrival environment, with exact screens in a photographic iPhone 15 Pro template. Same hardware source as CashBell, credited in `../devices/SOURCES.md`. No video. The native Python/Pillow renderer composites actual screens under the transparent hardware, without changing their proportions. The hero uses phone viewports; the gallery contains complete scrollable screen images and links to their full PNGs.

The page explains each screen's observable function and labels in-screen figures as sample records, not business outcomes. Role is Product Designer, without attributing the project to IDSSPL.

Build with `python scripts/render-valet-showcase.py`, then `npm run build`.

## Background asset

Built-in image generation produced `valet-background.png`; only the environment was generated. Prompt: premium photoreal wide background only, hotel valet arrival portico at blue hour, navy charcoal stone and forest-green glass, warm amber lights, dark sedan softly out of focus at rear right, key host stand at left, empty dark polished stone foreground for device compositing; full-frame 50mm architectural product photograph, real textures, restrained grade. No phones, screens, UI, text, logos, heavy fog, bloom, CGI or cyberpunk.

The final composite assets are `src/showcases/valet-hero.webp` and `src/showcases/valet-hero-mobile.webp`. The 17-screen gallery stays below with each screen's function.
