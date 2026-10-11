# Synthesizes the 30.4 s music bed (music.wav): a soft pad (Cmaj9, Am9, Fmaj9, G6/9)
# with a plucked eighth-note arpeggio at 96 bpm and a light stereo echo. Needs numpy.
import wave
import numpy as np

SR, T = 48000, 30.4
n = int(SR * T)
out = np.zeros((n, 2))


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


chords = [[48, 55, 64, 67, 74], [45, 52, 60, 64, 71], [41, 48, 57, 64, 69], [43, 50, 59, 64, 69]]
L = 7.6
for i, ch in enumerate(chords):
    s, e = int(i * L * SR), min(n, int((i + 1) * L * SR + 1.5 * SR))
    tt = np.arange(e - s) / SR
    env = np.minimum(1, tt / 1.8) * np.minimum(1, np.maximum(0, (e - s) / SR - tt) / 1.5)
    for k, m in enumerate(ch):
        f = hz(m)
        v = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.003 * tt + 1) + 0.15 * np.sin(4 * np.pi * f * tt)) * env * 0.06
        pan = 0.3 + 0.4 * (k / len(ch))
        out[s:e, 0] += v * (1 - pan)
        out[s:e, 1] += v * pan
    step, arp = 60 / 96 / 2, [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12]
    j, tpos = 0, i * L + 0.6
    while tpos < (i + 1) * L - 0.2 and tpos < T - 1.0:
        f = hz(arp[j % 4])
        s2 = int(tpos * SR)
        e2 = min(n, s2 + int(1.2 * SR))
        tt = np.arange(e2 - s2) / SR
        v = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 4.5) * np.minimum(1, tt / 0.004) * 0.035
        p = 0.25 if j % 2 else 0.75
        out[s2:e2, 0] += v * (1 - p)
        out[s2:e2, 1] += v * p
        j += 1
        tpos += step
for dl, g in [(0.23, 0.35), (0.37, 0.25), (0.61, 0.15)]:
    d = int(dl * SR)
    out[d:, 0] += out[:-d, 1] * g
    out[d:, 1] += out[:-d, 0] * g
fade = int(2.5 * SR)
out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out[: int(0.8 * SR)] *= np.linspace(0, 1, int(0.8 * SR))[:, None]
out /= np.abs(out).max() * 1.12
w = wave.open("music.wav", "wb")
w.setnchannels(2)
w.setsampwidth(2)
w.setframerate(SR)
w.writeframes((out * 32767).astype(np.int16).tobytes())
w.close()
