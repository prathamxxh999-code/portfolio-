# CRM reference film, version 2

Motion reference supplied by the user:
`8faaac8aca8d68724dade4e4dc46dea9.mp4` — 1440 × 1080, 60 fps, 26.35 seconds.
The reference is not included in the public build or used as final footage.

## Photographic hardware scene

`hardware/monitor-teddy-gr.jpg` is a real 3600 × 2400 desk-and-monitor photograph by Teddy GR,
published December 13, 2021. It includes the physical monitor, stand, keyboard,
desk, plant and original environmental lighting. The only replacement is the
monitor display content, which uses captured CRM screens. No AI image generation
and no code-drawn hardware are used in the film.

Source: https://unsplash.com/photos/a-computer-monitor-sitting-on-top-of-a-white-desk-gVpXbCGG6jI
License: https://unsplash.com/license
Image: https://images.unsplash.com/photo-1639413665566-2f75adf7b7ca

## Interface assets

All UI screenshots, component crops, icons, brand mark and team portraits are
captured from the existing IDSSPL CRM project. Text, controls and source layouts
are not redrawn. Task assignment, priority, due-date and completion states are
captured after performing the real actions in an isolated local demo session.
Count-up totals come from the unmodified source dashboard before demonstration:
50 clients, 5 open tasks, 2 active cases and 0 completed tasks. They are sample
record counts, not business-performance claims.

DM Sans is the existing CRM typeface. Its font and Open Font License are retained
in the parent `fonts/` directory.

## Render and timing

From the repository root, with Pillow, NumPy and FFmpeg installed:

```powershell
python scripts/render-crm-reference.py --proofs
python scripts/render-crm-reference.py --paper '#e9f4df' --output crm-reference-mint-film --ffmpeg C:/path/to/ffmpeg.exe
npm run build
```

To recapture source UI from the running local CRM, use
`node scripts/capture-crm-reference.cjs`. Set `CRM_CAPTURE_URL` if its preview
address differs from `http://127.0.0.1:8781/`. The capture uses an isolated
browser session and the application's existing local demo sign-in.

The film contains exactly 1581 frames at 60 fps (26.35 seconds). It is 1440 × 1080,
H.264, SDR Rec.709, with no audio stream. All section camera moves use a common
vertical coordinate system and quintic ease-in-out; adjacent modules and counters
stagger by 125 milliseconds. Native task states are captured after actual
assignment, priority, date and completion actions. The closing camera returns to
the exact opening photograph for the loop.

`proofs/` contains storyboard frames for inspection. `screens/capture.json`
records native field geometry, source counts and the original icon paths.
The website's CRM gallery uses this same photographed setup, with each original
interface fitted into the monitor. The CashBell film remains separate and dark.
