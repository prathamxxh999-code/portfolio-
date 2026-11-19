# CashBell and CRM showcase sources

The active portfolio films use actual project interfaces and photographed hardware.
No generative imagery, invented interfaces or code-drawn devices are used.

- CashBell: the selected Flutter project at `C:/cashbell_flutter`, captured in its
  native **dark** theme. See `cashbell-v3/SOURCES.md` for real interaction clips,
  the corrected mockup-resolution brief and the continuous 45.3-second edit.
  All records are the app's sample data. The earlier photographic version is
  retained in `cashbell-v2/` for comparison.
- CRM: the existing IDSSPL CRM workspace. See `crm-v2/SOURCES.md` for the actual
  UI states, photographed desk scene and 26.35-second reference sequence.
- `recordings/`: natural-speed source recordings and capture timings. CashBell's
  camera-island safe area is added around the capture without cropping the UI.
- `devices/`: earlier templates retained for `render-project-showcases.py`.
  Active reference films use the photographs documented in their source folders.
- `fonts/`: DM Sans, with its Open Font License.

## Re-render

Requires Python, Pillow, NumPy and FFmpeg. Run from the repository root:

```powershell
python scripts/render-cashbell-motion.py --proofs --ffmpeg C:/path/to/ffmpeg.exe
python scripts/render-cashbell-motion.py --ffmpeg C:/path/to/ffmpeg.exe
python scripts/render-crm-reference.py --paper '#e9f4df' --output crm-reference-mint-film --ffmpeg C:/path/to/ffmpeg.exe
npm run build
```

Both active films export H.264 MP4, 1440 × 1080, 60 fps, SDR Rec.709, without an
audio stream. Source recordings play at 1×. CashBell uses native dark UI; CRM
preserves its original cream/green interface inside a mint presentation canvas.

Phone gallery exports are 1024 × 1600; CRM gallery exports are 2560 × 1600.
Web videos autoplay muted and loop inline without playback CTAs, preserving
their full 4:3 composition on every viewport. Leaving the viewport, changing
projects or hiding the tab pauses playback. Reduced motion shows the poster.

The static build includes exports from `src/showcases/`. Rendering inputs stay
in `scripts/` outside the public site. Earlier exports remain available for
comparison and existing preview links.

CRM now uses the separate `crm-v2/` workflow: the user's 26.35-second reference,
1440 × 1080 at 60 fps, actual UI states and a photographed desk-and-monitor scene.
See `crm-v2/SOURCES.md` for the source photograph, sequence and reproduction.
