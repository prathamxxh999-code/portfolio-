# CashBell continuous product film

This revision responds to the user's layout and presentation feedback: actual
interaction footage replaces the repeated headline/phone/feature-card format.
The approved CRM film supplies the connected vertical-camera approach; the
user's mobile reference supplies the travelling phone gallery and card lift.

## Locked format and corrected prompt

The user explicitly selected **1440 × 1080, 4:3**. The authored timeline is
2718 frames at 60 fps: exactly 45.3 seconds. There is no audio stream.
`BRIEF.txt` retains the user's supplied sequence, with the video canvas and
phone-display resolutions specified separately. Phone screens stay portrait.

## Source UI and real interactions

Source app: `C:/cashbell_flutter`, existing release web build, native dark mode.
The isolated browser uses the app's built-in existing-credit demo account.
`screens/` contains original 860 × 1760 captures at 2× pixel density.
`clips/` contains natural-speed CDP screencasts. Original timestamped JPEG frame
folders are retained locally and excluded from Git; the MP4 source clips and
`capture.json` are sufficient to reproduce the finished film. Screencast raster
resolution is 430 × 880; the authored output
resamples to 60 fps without retiming native interaction. `capture.json` records
source durations and actual click/drag coordinates.

The footage contains actual phone-number entry, OTP verification, Home scroll,
offer selection, application review, sample submission and tracker, loan-amount
and tenure controls, the native Bell AI response animation, and the repayment
preview. The recorded repayment uses **Simulate pending confirmation** in the
local demo; its resulting pending status and sample notice remain visible.
No live lender, live AI, credit bureau or payment gateway is contacted. No
approval, score, application status, result or business metric is invented.

## Existing hardware and artwork

The hardware plate is `../devices/iphone-15-pro.png`, 1419 × 2796, an existing
black titanium iPhone 15 Pro template credited by MockUPhone to Apple Design
Resources. Original display bounds are 1179 × 2556 at (120, 120). The native app
is fitted uniformly into that opening, leaving camera-safe space above it.
The source bezel, camera island and highlights are preserved. The renderer
does not generate or procedurally draw substitute hardware.

Provenance and repository license: `../devices/SOURCES.md` and
`../devices/LICENSE-MockUPhone.txt`.

`icons/` contains the existing CashBell app's approved wordmark, Bell AI artwork,
calendar and shield. No new AI assets are made. Dark lighting, a geometric
cursor and the camera path are authored presentation graphics.

## Edit and reproduction

| Time | Content and motion |
| --- | --- |
| 0–2 | Interface ecosystem pushes toward the same central login phone |
| 2–5.2 | Real login and OTP interaction inside the phone |
| 5.2–9.2 | Native Home scroll with a controlled push and pullback |
| 9.2–13 | Continuous horizontal gallery, five actual app views |
| 13–18 | Real offer card lifts, returns and is selected in the app |
| 18–22 | Connected camera travel to live amount and tenure controls |
| 22–28.2 | Actual submission animation, receipt details and native tracker |
| 28.2–34 | Real Bell AI response and a travelling Activity/Profile gallery |
| 34–39.2 | Native slide gesture, processing preview and pending confirmation |
| 39.2–43 | Payment phone pulls back into the surrounding app ecosystem |
| 43–45.3 | Original brand mark and return to the identical opening composition |

Run from the repository root, with Python, Pillow, NumPy, Playwright and FFmpeg:

```powershell
$env:SHOWCASE_FFMPEG = 'C:/path/to/ffmpeg.exe'
node scripts/capture-cashbell-motion.cjs
python scripts/render-cashbell-motion.py --ffmpeg $env:SHOWCASE_FFMPEG
npm run build
```

The capture depends on a local demo storage state, referenced by the script;
it is not shipped in the public site. Rendering from retained captures does
not require signing into or running CashBell. `--proofs` renders only review
frames. The continuous camera uses integer-frame timing and quintic easing.
Public exports are the film, JSON metadata and a poster in `src/showcases/`.
The original inputs and all editing sources stay outside the public build.

The portfolio hero uses a 41 KB lossless studio-lighting extension around the
unchanged film. Rebuild it with `python scripts/prepare-cashbell-hero.py`. Its
source coordinates align with the video's actual background, preserving sharp
UI and hardware without filters, colour blending or a feathered video mask.
