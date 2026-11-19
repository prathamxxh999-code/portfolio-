# CashBell mobile reference film

Motion reference supplied by the user:
`eb608ed3e91117b79d0275adce3095e7.mp4` — 1600 × 1200, 30 fps, 45.30 seconds.
The reference supplies pacing and composition ideas; its footage and interfaces
are not included in the final film or public build.

## Actual project UI

All screens come from the selected `C:/cashbell_flutter` project in its native
dark theme, captured at 430 × 880 CSS pixels and 2× pixel density. `screens/`
contains Home, My loan, Application, Offers, Activity and two actual repayment
review states. Bank account was selected using the native method control in
the local sample session. No payment was attempted.

Source text, colours, controls, icons and proportions are preserved. Sample
amounts are already present in the app; they are not business-result claims.
The animated balance, offer and EMI panels are crops of those actual screens.
The original recording's loan section plays at 1×; resampling it to 60 fps does
not retime the interaction. A camera safe area is added above the native UI.

## Photographic hardware

Both used photographs are by Jakub Żerdzicki, under the Unsplash License:
https://unsplash.com/license

1. `hardware/hand-isolated.jpg`, used to extract the photographed phone:
   https://unsplash.com/photos/a-hand-holding-an-iphone-with-a-blank-screen-aE_MMfeRKvs
   Image: https://images.unsplash.com/photo-1717390758666-97dc77ef7a8c
2. `hardware/hand-dark.jpg`, the original in-hand room scene for the opening,
   closing and gallery mockups:
   https://unsplash.com/photos/a-person-holds-a-phone-with-a-blank-screen-9GfR3zLyy6o
   Image: https://images.unsplash.com/photo-1744869985867-d23cc60e3625

`hand-room.jpg` is an unused source candidate:
https://unsplash.com/photos/a-person-holding-a-cell-phone-in-their-hand-2MbXuj8PDrA

`prepare-cashbell-media.py` extracts the photographed body and glass mask,
corrects its perspective and restores a small obscured bezel strip using pixels
from the opposite photographed edge. The physical camera notch, glass corners,
material and highlights come from the photograph. Original JPEGs are retained
unchanged. No AI hardware or synthetic device shell is used.

The room is gently darkened before the unchanged UI is fitted into the display.
Floating shadows and restrained background lighting are presentation graphics.

## Timeline and reproduction

Exactly 2160 frames: 36 seconds, 1440 × 1080 at 60 fps, H.264 SDR Rec.709,
without an audio stream.

| Time | Composition |
| --- | --- |
| 0–3.6 | Real in-hand phone, slow opening push |
| 3.6–7.2 | Home screen macro pulling back |
| 7.2–11.5 | Native loan recording and balance-card reveal |
| 11.5–16 | Application and comparison, paired devices |
| 16–20.5 | Actual offer detail lifting out of the phone |
| 20.5–25 | EMI breakdown and native payment-method selection |
| 25–29.2 | Activity screen |
| 29.2–33 | Three-screen spread |
| 33–36 | Return to the original photographic composition |

Movement uses quintic ease-in-out and brief directional dissolves. The last
composition matches the first for looping. Run `prepare-cashbell-media.py`,
then `render-cashbell-reference.py --ffmpeg C:/path/to/ffmpeg.exe` from the repo
root. `--proofs` exports storyboard frames without rendering the full movie.
Public outputs include `src/showcases/cashbell-reference-film.mp4`, its JSON
metadata, a photographic poster and three photographed gallery mockups.
