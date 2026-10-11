# sortNow Learn: brand

**Idea:** solve the puzzle, get ahead. Calm, encouraging, light. The mark is three puzzle pieces that build a staircase, with a spark when the last one clicks in.

## The mark and logo
| File | Use |
| --- | --- |
| `sortnow-learn-mark.svg` | Master mark. Sharp at any size. Also the website favicon (`src/app/icon.svg`). |
| `sortnow-learn-mark-1024.png` | The mark alone, transparent corners. App icons, avatars, video watermark. |
| `sortnow-learn-logo-for-light-backgrounds.png` | Mark + wordmark, transparent, dark text. |
| `sortnow-learn-logo-for-dark-backgrounds.png` | Mark + wordmark, transparent, white text. |
| `video/` | Animated logo intro (see below). |

Wordmark: **sortNow** in Outfit 600, letter-spacing -0.04em; **Learn.** underneath in Outfit 300, indented about one letter, with a coral full stop.

Rules: keep clear space of at least half the mark's height. Do not recolor the pieces, stretch, rotate or add effects. On busy footage keep the teal tile. For a watermark use the mark alone.

## Colors
| Name | Hex | Use |
| --- | --- | --- |
| Deep teal | `#1F6F8B` | Headlines, buttons, links |
| Soft mint | `#8FDDE7` | Accents, chips, the first puzzle piece |
| Warm coral | `#FF6F61` | The full stop, highlights, the second piece |
| Sunny yellow | `#FFD166` | Points, warmth, the third piece |
| Off-white | `#FBFBFD` | Page background |
| Ink | `#1D1D1F` | Body text |
| Secondary | `#6E6E73` | Supporting text |
| Muted | `#76767A` | Captions (meets contrast on white) |
| Tile gradient | `#2A8CAE` to `#1B607A` | The logo tile |

## Fonts
- **Outfit** (Google Fonts, free): headlines (weight 300, teal, letter-spacing -0.02em), wordmark, buttons, numbers. Small caps labels are Outfit 500, uppercase, letter-spacing 0.2em, coral.
- **Inter** (Google Fonts, free): body text and captions. 400 at 17px, line height 1.6.

## Look and motion
Light, airy, Apple-like. Soft pastel gradient washes, frosted-glass white cards, big rounded corners, soft shadows. Motion is slow and smooth (ease-out, about 0.6 s); things fade up. Tone: plain and kind, with a coral full stop after the key word ("Get ahead.").

## Video
- `intro-landscape-light.mp4`, `intro-landscape-dark.mp4`: 1920x1080, 30 fps, 4.4 s, for YouTube and title cards.
- `intro-vertical-light.mp4`, `intro-vertical-dark.mp4`: 1080x1920, for reels and shorts.
- `logo-intro-light-alpha.webm`, `logo-intro-dark-alpha.webm`: transparent (VP9 alpha). The matching ProRes 4444 `.mov` files for video editors are about 30 MB each, so they are not in git; `brand/video/README.md` shows how to regenerate them.
- `intro-landscape-light.gif`: 960 px loop for chats and docs.

The animation: the tile appears, the mint and coral pieces slide in, the yellow piece drops and clicks into place, the spark pops, the mark glides aside and the wordmark arrives, the coral full stop pops and then breathes gently. To regenerate or change it, see `brand/video/README.md`.
