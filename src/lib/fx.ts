// Small feel-good effects. All of them are browser-only, skip themselves for people who ask for
// reduced motion, and never throw: a blocked audio context must not break a lesson.

export function reducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const COLORS = ["#1f6f8b", "#8fdde7", "#ff6f61", "#ffd166", "#6c63c7"];

/** A short burst of paper confetti from near the top of the screen. */
export function confetti(count = 140): void {
  if (typeof document === "undefined" || reducedMotion()) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:90";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);
  const w = window.innerWidth;
  const pieces = Array.from({ length: count }, () => ({
    x: w / 2 + (Math.random() - 0.5) * w * 0.3,
    y: window.innerHeight * 0.25,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 11 - 3,
    size: 5 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] as string,
    round: Math.random() > 0.65,
  }));
  const start = performance.now();
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, window.innerHeight);
    for (const p of pieces) {
      p.vy += 0.32;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1600) / 900);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    if (t < 2500) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

export function haptic(ms = 12): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator && !reducedMotion()) navigator.vibrate(ms);
  } catch {
    // ignore
  }
}

// ---- Sound: off until the learner turns it on, and the choice is remembered.
const SOUND_KEY = "sn_sound";
type Name = "tap" | "lock" | "win" | "miss";
let audio: AudioContext | null = null;

export function soundOn(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSound(on: boolean): void {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

function beep(freq: number, at: number, dur: number, vol = 0.05, type: OscillatorType = "sine") {
  if (!audio) return;
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, audio.currentTime + at);
  g.gain.exponentialRampToValueAtTime(vol, audio.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + at + dur);
  o.connect(g).connect(audio.destination);
  o.start(audio.currentTime + at);
  o.stop(audio.currentTime + at + dur + 0.02);
}

export function play(name: Name): void {
  if (!soundOn()) return;
  try {
    audio ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audio.state === "suspended") void audio.resume();
    if (name === "tap") beep(520, 0, 0.05, 0.035);
    if (name === "lock") {
      beep(660, 0, 0.07);
      beep(880, 0.07, 0.09);
    }
    if (name === "win") [523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.09, 0.22, 0.06, "triangle"));
    if (name === "miss") {
      beep(300, 0, 0.14, 0.05, "triangle");
      beep(220, 0.12, 0.2, 0.05, "triangle");
    }
  } catch {
    // Audio blocked or unsupported: stay silent.
  }
}
