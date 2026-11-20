# Retro PC portfolio draft

Retro desktop release source, November 20, 2026.

## Current experience

The user's warm room / front-facing CRT image supplies the setting. A silent
1920 x 1080, 30 fps ambient MP4 animates coffee steam, wind through foliage,
the tape deck reels, stereo VU needles and lifted magazine
page corners with quicker gusts and a longer settling phase. Sticky-note tops
stay attached while their free edges curl; layered steam rises from the cup.
Dust drifts through the room. The hanging lamp and middle-right orb lamp are
removed. Only the retained upper-right lantern flickers; removed lights have
no residual glow or animation.
The entire PC and
keyboard remain a fixed photographic plate. The current window loop is
524 frames / 17.4667 seconds long.
Mobile and data-saving connections load a 960 x 540 version of the same loop.
Three supplied prints are installed as physical wall frames at different
heights and sizes: a small tabletop frame with a stand behind the
left mixing console, raccoon and cat on the right wall. Their
artwork is excluded from the wind mask so printed green details do not bend.
The enlarged left window plays the user's latest drifting-clouds night footage
at its natural speed, with the indoor fern, sill, globe and radio in front.
Six anime collectibles sit on the cleared right shelves; a crouched Zenitsu
statue sits on the vintage computer tower. A wired mouse and pad sit beside
the keyboard, with magazine stacks moved farther right.
The tabletop print now uses the user's exact supplied Spider-Man "NEVER
GIVE UP." image, src/intro/tabletop-spiderman.webp, replacing the less readable
Devanagari quote. It is a perspective-matched HTML image layer with subtle
glass reflections. Cover fitting fills the frame with less than 1% edge crop;
the speech bubble stays fully visible, and its text is not regenerated or
retyped. The physical wooden frame and
stand remain in the room video. The original Panda print stays underneath
as reversible source only. The overlay scales in the same room coordinates
and disappears with the room when an app opens full screen.
The previous quote image is retained as src/intro/tabletop-quote.png but is
no longer referenced by the page.
The untouched Spider-Man upload is retained as posters/spiderman-source.png.
Its web display copy is encoded at 368 x 552, WebP quality 94, for the small
physical frame; it does not need to fetch the 1.3MB original on mobile.

The room master and empty desktop wallpaper were made with built-in imagegen.
The MP4 is a local Python/Pillow/NumPy/FFmpeg render from that master, not an
AI-generated video clip. Fal required reauthentication and the connected video
service lacked sufficient generation credits; neither submitted a video job.
No generative edits were applied to the user's original portrait.

## Sequence

- 0.0-0.55 s: room and CRT power-up.
- 0.55-5.3 s: existing multilingual cursor greeting inside the CRT.
- The room camera stays fixed through the entire greeting and desktop entry.
- At 5.4 s: finish the multilingual greeting and fade to the live terminal text,
  Welcome to my portfolio. There is no automatic camera zoom after Hello.
- After typing: hold indefinitely. Plain terminal-style > Enter portfolio _
  appears inside the screen. It works by click or keyboard Enter.
- Welcome and command text use bold pale lime monospace lettering with a
  restrained CRT glow for clearer contrast against the dark screen.
- Enter reveals the Windows-style desktop with Portfolio and Resume folders.
- Both original yellow Windows icons use identical rows and label baselines,
  with smaller icon/hitbox sizes on the compact CRT desktop.
- Classic My Computer and Recycle Bin graphics sit in the first row, with
  Portfolio and Resume underneath. Short CRT screens use smaller rows so the four icons
  stay clear of the one-line hint and taskbar.
- The one-line desktop hint reads: Open a folder to get started.
- Every folder opening first shows an opaque black screen for 180ms. Behind
  it, the OS switches directly to full viewport dimensions without a zoom.
- The Windows loader then holds for at least 500ms, continuing until the
  portfolio is ready. The app fills the viewport inside its blue Windows
  frame. No photographic bezel remains after folder entry.
- Closing an app returns to the expanded desktop. Restart resets the room;
  Escape safely cancels an opening, including during blackout or loading.
- Portfolio opens the real existing site in a same-origin iframe. The user's
  original photo, dark/lime theme and project order are preserved.
- Resume shows exact renders of the unchanged two-page public PDF, with zoom
  and an optional download. Resume buttons are hidden in the embedded website.
- The classic Windows loader covers the screen before each app opening and
  while the real page loads. Hidden app layers cannot peek through.
- The taskbar shows live client time and date. Start opens a compact decorative
  Windows-style system panel; Restart is its only active menu action and resets
  the entire experience, including the embedded page, back to the first Hello.
  Its circular restart arrow and label share one center line and hit area.
- Refresh returns to the room intro. Reduced motion opens the desktop directly.

## Source and build

- src/retro-intro.js: camera, screen geometry, typing and viewport expansion.
- src/greeting.js: multilingual cursor formation and entry playback.
- src/pc-desktop.js: folders, app windows, resume zoom and PDF download.
- src/retro-intro.css, src/pc-desktop.css: CRT, terminal and desktop styling.
- scripts/render-pc-room.py: reproducible ambient motion render.
- scripts/prepare-pc-assets.py: photographic nine-slice bezel and PDF preview.
- room-landscape-source.png, desktop-wallpaper-source.png: imagegen masters.
- room-render.json: actual render dimensions, duration and motion description.
- src/intro/room-ambient.mp4: active background video.
- src/intro/room-ambient-mobile.mp4: smaller mobile background video.
- src/intro/room-hardware.webp: fixed transparent PC/keyboard plate.
- src/intro/room-bezel.webp: unused asset from the earlier bezel draft.
- src/intro/desktop-wallpaper.webp: empty hill-and-sky desktop wallpaper.
- src/intro/resume-page-1.webp, resume-page-2.webp: PDF page previews.
- scripts/install-whiteboard.py: localized wall edit preserving original PC pixels.
- room-landscape-whiteboard.png: preserved room master with the handwritten board.
- room-landscape-framed.png: protected original PC, board, keyboard and print plates.
- decor/room-final-imagegen-source.png: selected final room edit without the hanging lamp.
- room-landscape-night-studio.png: final installed room with protected original plates.
- room-landscape-window-video.png: final master with the user's actual window footage.
- window/outside-cloudy-night.mp4: current user-supplied night-sky video; source audio omitted.
- window/outside-starry-sky.mp4: previous starry-sky source, retained for reversibility.
- window/room-ambient-starry-base.mp4: approved looping room motion source for fast window replacements.
- window/outside-reference.mp4: previous full-moon/tree source, retained for reversibility.
- scripts/install-room-details.py and prepare-window-video.py: installation and occlusion matte.
- scripts/install-room-art.py and posters/BRIEF.md: selected frame edit and prompt.
- whiteboard-imagegen-source.png: preserved built-in imagegen board edit.

The screen is native-sized HTML outside the video layer; this avoids nested
raster scaling of the live site. Folder entry changes layout behind black;
there are no screen transforms, bezel elements or photographic borders after entry.
The outer dialog uses overflow clipping rather than a hidden scroll container,
preventing automatic focus scrolling from shifting the whole bezel sideways.
Resizing during entry
keeps the loader fitted without cancelling the transition. Mobile room framing
fits the whole monitor case, with compact icon and menu sizing.
The Windows desktop and taskbar use a custom classic white pixel-arrow cursor.
The approved hanging fern retains its original sway. All other plant motion
uses tighter leaf-color masks and reduced displacement, so shelves, speakers,
books and the whiteboard do not wobble with the foliage. Rendering asserts
that the tower and collectible geometry is untouched before the light pass, as well
as preserving the identical PC region.
The lower-left Monstera mask extends to the large leaves near the floor,
with a gentle coherent sway rather than moving the pot or nearby records.
Background video pauses during folder entry and once covered by the
full-screen desktop. Greeting canvas rendering stops after the greeting.
The render asserts an identical rigid PC region at representative frames.

Run python scripts/prepare-pc-assets.py (Poppler required), then
python scripts/install-room-details.py, then
python scripts/prepare-window-video.py --ffmpeg PATH_TO_FFMPEG --source outside-cloudy-night.mp4 --crop-y .35, then
python scripts/replace-window-video.py --ffmpeg PATH_TO_FFMPEG, then npm run build.
For a complete room-motion rebuild rather than a window-only replacement,
use scripts/render-pc-room.py after preparing the window footage.

Older field-scene and reference-loop assets are retained as unused draft source.
They are not referenced by the current page.

## Current window video provenance

User supplied locally on November 20, 2026:
"From Klickpin.com- Simple slow living outdoors with charm and practical value
with easy charm for a softer life-pin-id-775463629619811679.mp4".
Preserved as window/outside-cloudy-night.mp4. H.264 SDR Rec.709, 720 x 1280,
30 fps, 524 video frames / 17.4667 seconds, with an unused AAC stereo track.
The complete video is shown at 1x speed, uniformly cover-cropped across the
two window panes. Crop centering is 50% horizontal / 35% vertical. Window
frames, indoor foliage, globe and radio occlude it. The finished desktop and
mobile room loops are silent H.264, 30 fps, 1920 x 1080 and 960 x 540.
The approved ambient room intentionally repeats at its original speed under
the new window view. The new clip plays in full at 1x. Only window-glass pixels
are replaced; the pre-existing indoor objects and their motion are retained.

## Built-in imagegen prompts

### Room master

Use case: precise-object-edit. Asset: first frame of a Full HD 16:9 LANDSCAPE retro-computer room video and interactive website mockup. Adapt the attached square room photograph into a full, naturally composed 1920x1080 LANDSCAPE scene by extending the room to the left and right, with more wall posters, shelves, plants and warm light consistent with the existing room. Preserve the exact visual idea of this image: a straight-on vintage beige/rose CRT monitor on its horizontal computer case, a full keyboard on the wooden desk, leafy plants and amber desk lamp on the left, stacked old speakers on the right, collage poster wall with muted hot-pink light at upper right. Keep the SAME front-on view and coherent perspective. The PC is the permanent central focus and must be large enough for an interactive website inside the screen: monitor case about 32 percent of full image width, centered, its entire rectangular display visible and perfectly front-facing. Keep the whole monitor, computer base and keyboard visible, with a comfortable strip of desk around them. Make the CRT display a completely EMPTY very dark near-black green screen, with a clearly defined rectangular screen interior and extremely subtle glass curvature/reflection at its far edges. No green-screen chroma, no graphics, no text on the display. Cinematic photorealistic materials, believable worn plastic, tactile keys, vintage hi-fi speakers, natural plant detail, warm amber lamp mixed with subtle pink room light, deep shadows and rich restrained color grade, fine film texture. Widescreen composition with detailed room content across the entire frame, no portrait column, no blurred side extensions, no duplicated computer, no people, no human portrait, no watermark, no timestamp, no labels, no added user interface. Camera locked straight-on, no diagonal angle, no fisheye. Preserve the reference's room character and computer silhouette. Output high-detail 16:9 landscape.

### Desktop wallpaper

Asset: a clean classic early-2000s Windows-style desktop wallpaper for an interactive retro PC. Use the green rolling hills and blue sky of this reference only. Remove the computer, its cables, all foreground objects, all text, timestamp, watermark and borders. Recompose as a simple photorealistic LANDSCAPE 4:3 wallpaper: a smooth brilliant green grassy hill across the lower half, deep blue sky and a few wispy white clouds across the upper half, nostalgic sunny-day photography, calm, clean composition, recognizable classic desktop-wallpaper feeling. Empty landscape only; no folders, icons, logos, cursor, interface, people, screens, hardware or added text. A single portfolio folder will be rendered separately in HTML. Crisp natural grass and clouds, no illustration or cartoon.

### Final whiteboard edit (built-in imagegen)

Use case: precise-object-edit. Modify only the WHITEBOARD above the monitor in this exact landscape room. Make it feel like a real working designer's brainstorming board, not a large inspirational poster. EXTEND the physical whiteboard DOWNWARD BEHIND THE MONITOR, so its lower edge and lower notes are naturally OCCLUDED by the CRT case. The PC remains in front of it; the bottom whiteboard border must disappear behind the monitor rather than being a separate horizontal strip above it. Keep the exact PC position, screen opening and hardware geometry. Keep the board top and width in the same place; let its bottom continue behind the top 10 percent of the monitor. Change the huge headline into SMALLER casual, human fine-tip marker handwriting with natural uneven spacing and a subtle hand-drawn underline. Write the full quote exactly, as a modest central group of handwritten brainstorming notes: "Wake up to reality! Nothing ever goes as planned in this world. The longer you live, the more you realize that, in this reality only pain, suffering, and futility exist." The heading should be roughly half its current size and the body slightly smaller too, giving the board genuine breathing room. A few small arrows, two tiny underlined keywords, faint erased smudges, and the existing muted sticky notes at the sides can make it a lived-in brainstorm. Sticky notes and the lower part of the board may be partly hidden by the foreground monitor. Main quote remains readable in the upper visible board area. Physical off-white glossy dry-erase surface, thin aluminum frame, warm room reflections, realistic marker ink and shadows. Preserve ALL original room objects, colors, plants, lights, coffee, keyboard, furniture and speakers, full landscape 16:9 composition. Do not shift or regenerate the PC or change any monitor corners. No giant typography, typeset font, anime eyes or figures, logos, watermarks, grid lines or captions.

### Selected final room edit (built-in imagegen)

Remove only the hanging pendant lamp above the left side of the monitor,
including its shade, bulb, cap, cord and glare. Reconstruct the window glass,
wood frame and adjacent brick naturally. Keep the warm ambient grade and
upper-right lantern. Preserve the monitor/screen coordinates, keyboard/base,
CPU with Zenitsu, the six other figures and their spacing, wired mouse and
pad, magazines, Panda tabletop frame and easel behind the mixer, whiteboard,
two wall prints, globe, radio, coffee, plants and furniture. Full landscape
16:9 room. Selected source: decor/room-final-imagegen-source.png.
