# Design City

Original Vice City-inspired design arcade inside the existing retro desktop. The original portfolio portrait, dark/lime branding, featured project order and hidden AI bot remain unchanged.

## Final flow

1. Open Design Game below Portfolio.
2. New Game shows only the name popup.
3. Continue opens a separate mission-selection screen with an icon and explanation for each game.
4. The user-supplied pixel-city video loops behind both setup views.
5. Choosing a mission plays a 3.8-second road-video story, then a focused game canvas. Menu artwork is hidden during play. App views fit the screen; records use pagination.
6. Mission Passed / Busted saves the result on this device.

Missions: Pay ’n’ Polish (30 seconds, UI repairs), Layout Valet (45 seconds, tap or drag components to slots), Pattern Patrol (45 seconds, remove dark patterns). Six wanted stars represent design debt. Correct fixes earn 100 respect and clear a star; mistakes add debt and cost respect and time. Fast finishes earn a bonus.

## Player records

Browser-local profiles, separate mission rankings and history. Create/select, rename and delete a profile; delete individual runs after confirmation. Up to 50 profiles and 500 recent runs. Denied browser storage falls back to a clearly labelled session-only mode. These are neither verified competition results nor sitewide traffic analytics. No database, provider account or paid integration was provisioned.

## Media

- `road-reference.mp4`: user-supplied driving footage, 736x414. `story-road.mp4` is the first 3.8 seconds, silent. `story-road-4k.mp4` is a 3840x2160, 30fps Lanczos upscale with mild sharpening from the original. This is not AI restoration; source detail remains limited. The Fal connection required reauthentication, so no Fal job was submitted. Screens up to 1024px use the smaller clip for smooth playback. The final intro is full-bleed, with title and loading text over the footage, no separated section or blur filter. Cover framing crops to the viewport.
- `setup-reference.mp4`: user-supplied 22.21-second pixel city. `setup-city.mp4` preserves the video stream without audio. `setup-city-4k.mp4` is a nearest-neighbour 3840x2160 upscale preserving pixel-art edges; it does not create new source detail. Screens up to 1024px use the native-size clip. It loops during name entry and mission selection, pauses elsewhere, and uses a still for reduced motion.
- `after-hours.mp3`: original 73.846-second, 104 BPM instrumental composed by `scripts/render-design-city-music.py`: drum-machine percussion, syncopated bass, layered chords, electric keys, lead and delay. No samples or third-party soundtrack. Arcade SFX are synthesized separately. Audio loads on opt-in and stops on mute, game close or tab hiding.
- `loading-art-source.png`: original generated menu artwork, exported to `src/game-assets/design-city-story.webp` and a cropped desktop cover. Built-in image generation was used. Prompt: a wide hand-inked early-2000s Miami game-cover illustration with thick black outlines and airbrushed cel shading; young creative director with glasses at a cream CRT in a balcony studio; pink sunset, palms, teal waterfront, sports car and mouse close-up arranged in four diagonal comic panels. No text, official characters or game logos.
- Changa One, Anton and Yellowtail are self-hosted, with their licenses included in `src/game-assets/`. No unlicensed GTA fonts, logos, characters or music are used.
- Camouflage and game icons are original SVG. The 32px game cursor is an original PNG. The desktop retains its own classic cursor.

## Verification

Build, built-asset references, desktop state checks and player-record CRUD checks. Browser play-throughs completed all three missions and verified scores. Tested name/selection separation, video framing, music playback/muting, keyboard input, pause/resume, desktop return and 320px mobile fitting. All long Valet project screens are separate from the no-scroll game UI.
