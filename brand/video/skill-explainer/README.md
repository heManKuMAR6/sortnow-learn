# "What's an AI skill?" (15 s, 9:16)

A 15.2 s vertical explainer for Reels, Shorts and TikTok in the sortNow Learn style.

**Watch / download:** https://d2ol7oe51mr4n9.cloudfront.net/user_37V9fcZYfdjDnFwBTafEAUpXi9I/9df5d9fe-51e0-449c-ad1a-aebd2da9358a.mp4

| Time | On screen | Voiceover |
| --- | --- | --- |
| 0–2 s | Claude, ChatGPT and Copilot logos pop in; "What's an AI skill?" with a yellow underline swipe | "What's an AI skill?" |
| 2–4.7 s | *Without a skill: You repeat yourself.* A chat fills with the same instructions, a spinning loop icon counts ×1…×3 | "Instead of explaining the same task every time…" |
| 4.7–8.2 s | *With a skill: Save the steps once.* A "Weekly report" skill card; three steps tick in | "…you save the steps once, like a recipe card." |
| 8.2–10.6 s | Higgsfield 3D shot: puzzle pieces fly into the teal tile and click, sparkle. *Automatic: Loaded only when needed.* | "Claude, ChatGPT or Copilot picks it up when it's needed…" |
| 10.6–13.9 s | Flow with drawn arrows: your ask → AI assistant (the skill plugs in, it glows) → "Done, your way". *Every time.* ✓✓✓ | "…and does it your way. Every time." |
| 13.9–15.2 s | sortNow Learn mark and wordmark, "Learn AI in small pieces · learn.sortnow.co" | – |

## How it is made
- `skill.html`: the motion graphics. `setT(seconds)` places every element (eased, spring and draw-on animations), so every render is identical. Scene start times are the `S` object near the top of the script. Needs `Outfit.ttf`, `Inter.ttf` (Google Fonts) and `mark.png` (`../../sortnow-learn-mark-1024.png`) next to it. Product icons are from Simple Icons, used only to name the tools.
- `render.cjs`: renders 456 transparent PNG frames with Playwright (`node render.cjs fr 30 15.2`).
- `hero.mp4`: Higgsfield Seedance 2.5, 9:16, 1080p, 5 s, with the mark as image reference. Prompt: soft clay 3D, a glowing teal app tile like the logo; mint, coral and yellow pieces glide in on a curved path and click into place, the tile lights up, a white four-point sparkle pops, three tiny cubes float up. No text.
- `vo.wav`: Higgsfield Seed Audio, voice "Maeve": "What's an AI skill? Instead of explaining the same task every time... you save the steps once, like a recipe card. Claude, ChatGPT or Copilot picks it up when it's needed, and does it your way. Every time."
- `compose.sh`: times the voiceover to the scenes, lays the 3D shot under the frames (the animation's background fades out around it), adds the brand-film music ducked under the voice, and masters to -14 LUFS.
