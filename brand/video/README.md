# Logo intro (video)

Ready-made files in this folder (4.4 s, 30 fps):

| File | For |
| --- | --- |
| `intro-landscape-light.mp4` / `-dark.mp4` | 1920x1080: YouTube, title cards, slides |
| `intro-vertical-light.mp4` / `-dark.mp4` | 1080x1920: reels, shorts, stories |
| `intro-landscape-light.gif` | 960 px loop for chats and docs |
| `logo-intro-light-alpha.webm` / `-dark-alpha.webm` | Transparent (VP9 alpha), for the web and editors that read WebM |

The transparent **ProRes 4444 `.mov`** versions (about 30 MB each, for Premiere, Final Cut and DaVinci) are not in git. Regenerate them with the commands below, or ask whoever owns the brand for the files.

## Regenerate or change it
The animation is `source/intro.html`: a function `setT(seconds)` positions every piece, so it renders the same every time. Edit the timings there.

```bash
npm i --no-save playwright @fontsource/outfit    # needs ffmpeg installed
node brand/video/source/render.mjs land light 0 /tmp/frames-land-light
ffmpeg -framerate 30 -i /tmp/frames-land-light/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 14 -preset slow -movflags +faststart intro-landscape-light.mp4

# Transparent ProRes 4444 for editors
node brand/video/source/render.mjs land light 1 /tmp/frames-alpha
ffmpeg -framerate 30 -i /tmp/frames-alpha/f%04d.png -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le -alpha_bits 8 -qscale:v 14 logo-intro-light-alpha.mov
```
Use `vert` instead of `land` for 9:16, `dark` for the dark theme. `FRAMES=3` renders a quick test.
