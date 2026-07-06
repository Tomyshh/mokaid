/* global AudioContext, OscillatorType */
import { useChatStore } from "@/stores/chat-store";

/**
 * Playful UI sounds, synthesized with WebAudio — no assets to download, no
 * CSP or licensing concerns, and they stay crisp at any volume. Each cue is
 * a tiny melodic figure so agent activity "jumps out" without being noisy.
 */

export type SoundName =
  | "message" // agent replied in a chat
  | "sent" // you sent a chat message
  | "task-start" // an agent started working
  | "task-done" // an agent finished a task
  | "task-failed" // a run failed
  | "attention"; // approval needed

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // Browsers suspend contexts created before a user gesture.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Note {
  /** Frequency in Hz. */
  f: number;
  /** Start offset in seconds. */
  t: number;
  /** Duration in seconds. */
  d: number;
  /** Peak gain (default 0.08 — deliberately quiet). */
  g?: number;
  type?: OscillatorType;
}

function play(notes: Note[]): void {
  const audio = audioContext();
  if (!audio) return;

  const now = audio.currentTime + 0.01;
  for (const { f, t, d, g = 0.08, type = "sine" } of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, now + t);
    gain.gain.linearRampToValueAtTime(g, now + t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
    osc.connect(gain).connect(audio.destination);
    osc.start(now + t);
    osc.stop(now + t + d + 0.05);
  }
}

const CUES: Record<SoundName, Note[]> = {
  // Soft two-tone "pop" (like a friendly IM).
  message: [
    { f: 660, t: 0, d: 0.12 },
    { f: 880, t: 0.09, d: 0.18 },
  ],
  // Barely-there tick for your own sends.
  sent: [{ f: 520, t: 0, d: 0.08, g: 0.04 }],
  // Rising figure: someone rolled up their sleeves.
  "task-start": [
    { f: 392, t: 0, d: 0.12 },
    { f: 523, t: 0.1, d: 0.12 },
    { f: 659, t: 0.2, d: 0.2 },
  ],
  // Little major-arpeggio fanfare: work delivered.
  "task-done": [
    { f: 523, t: 0, d: 0.15 },
    { f: 659, t: 0.11, d: 0.15 },
    { f: 784, t: 0.22, d: 0.15 },
    { f: 1046, t: 0.33, d: 0.35, g: 0.1 },
  ],
  // Gentle descending minor — something went wrong.
  "task-failed": [
    { f: 440, t: 0, d: 0.2, type: "triangle" },
    { f: 330, t: 0.18, d: 0.3, type: "triangle" },
  ],
  // Door-bell "ding-dong": a human decision is needed.
  attention: [
    { f: 784, t: 0, d: 0.25 },
    { f: 622, t: 0.22, d: 0.4 },
  ],
};

export function playSound(name: SoundName): void {
  if (!useChatStore.getState().soundEnabled) return;
  try {
    play(CUES[name]);
  } catch {
    // Audio is a garnish — never let it break the app.
  }
}
