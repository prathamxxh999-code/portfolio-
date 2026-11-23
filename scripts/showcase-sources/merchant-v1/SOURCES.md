# PaySphere Merchant Management showcase

Source application: `C:/Users/Prathamesh Phadatare/Documents/Codex/2026-10-17/x20-i/outputs/PaySphere`.
This is the user's existing Merchant Management Portal session. The application
source was served read-only at a separate local origin, port 8792, so capture
actions did not touch the user's saved records or original application files.

## Native interface evidence

45 actual screen captures and demonstrated workflow states cover the command
centre, merchant directory, eight profile sections, onboarding and setup forms,
KYC/document review, payments, refunds, payouts, controlled retries,
reconciliation, maker/checker requests, service queues and Operations Copilot.
All records are explicitly synthetic prototype data. No live financial service,
authentication provider, identity verifier or AI endpoint was connected.

Two local demonstrations were performed through the actual UI: preparing an
independently reviewed sample pricing request, and selecting QR plus Smart POS
with Smart POS featured. The sample request remains pending; no approval or
financial instruction was executed. The payout status check retained its
unknown result and locked retry. Copilot replies came from the existing local
record/guidance logic. No interface controls or answers were redrawn.

`screens/capture.json` inventories routes, roles, descriptions, original raster
dimensions and file hashes. Original JPEGs are preserved. Public full-resolution
links point to their unchanged copies in `src/showcases/screens/merchant-*.jpg`.

## Photographed mockups

The film and all gallery mockups reuse the real desk-and-monitor photograph by
Teddy GR documented in `../crm-v2/SOURCES.md`. The hardware, stand, keyboard,
plant and lighting are photographic, not generated or code-drawn. Only the
screen display is composited. The photographic environment receives a restrained
dark grade; the captured app keeps its native navy, violet, teal and amber colors.

Photo: https://unsplash.com/photos/a-computer-monitor-sitting-on-top-of-a-white-desk-gVpXbCGG6jI
License: https://unsplash.com/license

Long gallery captures are linked in full. Photographic previews use the first
viewport fitted proportionally to the physical monitor display.

## Film and edit direction

The CRM film is the motion template: a photographic monitor opening, a light
wipe, continuous vertical section travel with quintic easing, small staggered
reveals, restrained interface focus zooms, native UI state changes and a return
to the opening monitor scene. Native UI states stay readable during holds.

Format: 1440 × 1080, 4:3, 60 fps, 1581 frames / 26.35 seconds, H.264 Rec.709,
without an audio stream. The first and last authored RGB frames match exactly.
The DM Sans editorial font and its OFL are retained in `../fonts/`; original UI
fonts and brand artwork remain inside the untouched captures.

| Sequence | Focus |
| --- | --- |
| 0–0.8 s | Real photographed monitor opening and upward light wipe |
| 0.8–4.3 s | Command centre |
| 4.3–7.4 s | Merchant directory to connected profile |
| 7.4–10.4 s | Payment ledger to payment trace |
| 10.4–14.2 s | Payout investigation and actual evidence-check feedback |
| 14.2–18.3 s | Native payment product-selection states |
| 18.3–21.7 s | Prepared request to independent checker view |
| 21.7–24.4 s | Copilot welcome to the actual payout-trace response |
| 24.4–26.35 s | Minimal close and return to the opening photograph |

Reproduction, from the repository root with Pillow and NumPy installed:

```powershell
python scripts/render-merchant-showcase.py --prepare --proofs
python scripts/render-merchant-showcase.py --ffmpeg C:/path/to/ffmpeg.exe
npm run build
```

The portfolio uses a silent inline loop without playback CTAs. Existing showcase
visibility and reduced-motion handling applies. Eight native expandable gallery
groups provide access to the 45 captures without loading every preview at once.
