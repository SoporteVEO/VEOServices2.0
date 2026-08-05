"use client";

/**
 * Plays a short two-note "chime" using the Web Audio API.
 *
 * Uses synthesis rather than a bundled audio file so we don't ship a binary
 * asset and so playback works cross-browser without codec concerns. The
 * AudioContext is created lazily and reused between calls; if it's suspended
 * (which happens on some browsers until the user interacts with the page),
 * we try to resume it and silently skip playback if the browser refuses.
 */

const STORAGE_KEY = "veo:notifications:sound-muted";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  try {
    audioContext = new Ctor();
    return audioContext;
  } catch {
    audioContext = null;
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  peakGain = 0.18,
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

export function isNotificationSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setNotificationSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (muted) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors (private mode, etc.).
  }
}

export async function playNotificationSound(): Promise<void> {
  if (isNotificationSoundMuted()) return;

  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  if (ctx.state !== "running") return;

  const now = ctx.currentTime;
  playTone(ctx, 880, now, 0.18);
  playTone(ctx, 1318.5, now + 0.14, 0.28);
}
