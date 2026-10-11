# Brand film (30 s)

A 30.4 s, 1920x1080 brand film for sortNow Learn: five AI-generated scenes, a voiceover, captions in the brand style, and the logo intro at the end. Made with Higgsfield.

**Watch / download:** https://d2ol7oe51mr4n9.cloudfront.net/user_37V9fcZYfdjDnFwBTafEAUpXi9I/bad00187-8d24-46c4-a648-9edd01ffe29e.mp4 (also in the Higgsfield library). The mp4 is about 12 MB, so it is not in git.

| Time | Scene | Caption (eyebrow / line) | Voiceover |
| --- | --- | --- | --- |
| 0–5 s | A young woman at her laptop, overwhelmed | THE AI ERA / AI is moving fast. | "AI is moving fast, and it's easy to feel behind, so we made it simple." |
| 5–10 s | Mint, coral and yellow pieces click into the mark, spark pops | SORTNOW LEARN / Learn it in small pieces. | "Small pieces you can actually finish." |
| 10–15 s | She solves the daily puzzle on her phone, confetti | DAILY CHALLENGE · 5 MIN / One puzzle a day. | "One five-minute puzzle a day." |
| 15–20 s | A manager walks his team through a sticky-note flow | SHORT LESSONS / For beginners and managers. | "Short, clear lessons for beginners and for managers." |
| 20–25 s | She climbs a staircase of giant puzzle blocks, spark in the sky | PIECE BY PIECE / Solve the puzzle. Get ahead. | "Piece by piece. You climb." |
| 25–30.4 s | Logo intro (`../intro-landscape-light.mp4`), last frame held 1 s | – | "sortNow Learn. Solve the puzzle. Get ahead." |

## How it was made
- **Scenes:** Higgsfield, Seedance 2.5, 1080p, 16:9, 5 s, no generated audio. Scenes 2 and 5 use `../../sortnow-learn-mark-1024.png` as an image reference so the pieces match the mark. The prompts are in `prompts.md`.
- **Voiceover:** Higgsfield Seed Audio, preset voice "Maeve", one take of the full script, cut into phrases and placed at the start of each scene (`build.sh` step 1).
- **Music:** synthesized by `music.py` (a soft pad and a plucked arpeggio), ducked under the voice.
- **Captions:** `captions.py`, frosted off-white cards, Outfit 500 coral eyebrow, Outfit 300 teal line, coral full stop.
- **Edit:** `build.sh` (ffmpeg): 0.35 s dissolves, a fade through white into the logo, captions fade and drift in, mastered to -14 LUFS (YouTube and Instagram level).

## Rebuild
Put the five scenes in this folder as `s1.mp4` … `s5.mp4`, the voiceover as `vo.wav`, and `Outfit.ttf` (the variable font from Google Fonts), then:
```bash
python3 captions.py && python3 music.py && ./build.sh
```
To change a caption, edit `CAPTIONS` in `captions.py`. To change timing, the scene boundaries are every 5 s, and the voice phrase cut points are the `atrim` values in `build.sh`.

## Vertical cut (9:16, for Reels, Shorts and TikTok)
Re-shot for vertical rather than cropped, 1080x1920, same 30.4 s timeline, voiceover and music, ending on `../intro-vertical-light.mp4`.

- **Recommended (app shot):** https://d2ol7oe51mr4n9.cloudfront.net/user_37V9fcZYfdjDnFwBTafEAUpXi9I/2307020f-d801-41c9-91d9-94cad4ad8925.mp4. Scene 3 is over her shoulder, so you see the quiz app on her screen.
- **Alternative (reaction shot):** https://d2ol7oe51mr4n9.cloudfront.net/user_37V9fcZYfdjDnFwBTafEAUpXi9I/e63936e4-1ec9-4f3b-b3b3-1f999f551f8e.mp4. Scene 3 faces her; the camera sees the back of the phone, and she does a small fist pump.

What changed from the 16:9 film:
- **Scene 3 fixed.** In the 16:9 film the phone screen faced the camera, so she seemed to play a phone she could not see. Both vertical versions have the screen facing her.
- **The same woman throughout.** One reference portrait (Higgsfield GPT Image 2.5) was passed as an image reference to scenes 1, 3 and 5.
- **Captions** come from `captions-vertical.py`: centered, with the card's bottom 340 px above the frame edge so they clear the app's caption and buttons.

Rebuild: `python3 captions-vertical.py && python3 music.py && ./build.sh --vertical`. Prompts are in `prompts.md`.
