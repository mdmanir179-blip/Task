// Web Audio API Synthesizer and Audio Chime Player for TBC Task Notifications

let audioCtx: AudioContext | null = null;
let cachedAudio: HTMLAudioElement | null = null;

// Initialize or resume AudioContext safely upon user gesture
export function initAudio(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  } catch (e) {
    console.warn('AudioContext initialization note:', e);
    return null;
  }
}

// Pre-create and unlock HTML5 audio element for instant playback on all mobile & desktop browsers
export function getUnlockedHtmlAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!cachedAudio) {
    try {
      cachedAudio = new Audio('/notification.wav');
      cachedAudio.preload = 'auto';
      cachedAudio.volume = 0.95;
    } catch {
      cachedAudio = null;
    }
  }
  return cachedAudio;
}

// Global user interaction listener to auto-unlock audio capabilities on first click/touch
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = initAudio();
      if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
        ctx.resume().catch(() => {});
      }
      const audio = getUnlockedHtmlAudio();
      if (audio && audio.paused && audio.readyState < 2) {
        audio.load();
      }
    } catch {}
  };

  window.addEventListener('click', unlockAudio, { passive: true, once: false });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: false });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: false });
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: false });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      unlockAudio();
    }
  });
}

// Sound enabled preference in localStorage
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('tbc_sound_enabled') !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tbc_sound_enabled', enabled ? 'true' : 'false');
  if (enabled) {
    initAudio();
  }
}

/**
 * Fallback to HTML5 audio element with safety reset
 */
export function playHtml5AudioFallback(): void {
  try {
    const audio = getUnlockedHtmlAudio();
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('HTML5 Audio playback note:', err);
        });
      }
    }
  } catch (e) {
    console.warn('HTML5 Audio fallback execution error:', e);
  }
}

/**
 * Synthesizes a melodious, crystal-clear notification music chime (E major ascending bell chord)
 * E5 (659Hz) -> G#5 (831Hz) -> B5 (988Hz) -> E6 (1319Hz)
 * Uses lookahead timestamping so events are NEVER scheduled in the past.
 */
function playWebAudioChime(ctx: AudioContext): void {
  try {
    // Lookahead offset of 0.05s guarantees strictly positive scheduling
    const now = ctx.currentTime + 0.05;

    // Master gain node with soft limiter to prevent distortion and maximize clarity
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, now);
    masterGain.connect(ctx.destination);

    const notes = [
      { freq: 659.25, time: 0.00, dur: 0.45, gain: 0.45 }, // E5
      { freq: 830.61, time: 0.12, dur: 0.50, gain: 0.50 }, // G#5
      { freq: 987.77, time: 0.24, dur: 0.55, gain: 0.55 }, // B5
      { freq: 1318.51, time: 0.36, dur: 0.85, gain: 0.65 }, // E6 Crystal chime
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(note.freq * 2, now + note.time);

      const startTime = now + note.time;
      const attackTime = startTime + 0.03;
      const endTime = startTime + note.dur;

      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(note.gain, attackTime);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(noteGain);
      overtone.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      overtone.start(startTime);
      osc.stop(endTime + 0.05);
      overtone.stop(endTime + 0.05);
    });
  } catch (err) {
    console.warn('Web Audio synthesis error, falling back to HTML5 audio:', err);
    playHtml5AudioFallback();
  }
}

/**
 * Plays the notification music chime.
 * If force is true (e.g. from user clicking "Test Chime" or "Music ON"),
 * it plays regardless of whether sound was previously disabled.
 */
export function playNotificationSound(force = false): void {
  if (!force && !isSoundEnabled()) return;

  try {
    const ctx = initAudio();
    if (ctx) {
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        ctx.resume()
          .then(() => {
            playWebAudioChime(ctx);
          })
          .catch(() => {
            playHtml5AudioFallback();
          });
        return;
      } else if (ctx.state === 'running') {
        playWebAudioChime(ctx);
        return;
      }
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }

  playHtml5AudioFallback();
}

/**
 * Request desktop/mobile system notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

/**
 * Send native system notification (e.g. Chrome / Android / Windows notification)
 */
export function sendBrowserNotification(title: string, body: string, icon = '/icon.svg'): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        silent: true, // We already play our custom melodious chime
      });
    } catch {
      // Ignore if in restricted context
    }
  }
}
