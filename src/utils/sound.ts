// Web Audio API Synthesizer and Audio Chime Player for TBC Task Notifications

let audioCtx: AudioContext | null = null;

// Initialize or resume AudioContext upon user gesture
export function initAudio(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Attach listener to auto-unlock AudioContext on first click or touch
if (typeof window !== 'undefined') {
  const unlock = () => {
    initAudio();
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

// Sound enabled preference in localStorage
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('tbc_sound_enabled') !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tbc_sound_enabled', enabled ? 'true' : 'false');
}

/**
 * Plays a melodious, professional notification music chime (E major bell chord)
 * E5 (659Hz) -> G#5 (831Hz) -> B5 (988Hz) -> E6 (1319Hz)
 */
export function playNotificationSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = initAudio();
    if (ctx && ctx.state !== 'suspended') {
      const now = ctx.currentTime;
      const notes = [
        { freq: 659.25, time: 0.00, dur: 0.45, gain: 0.30 }, // E5
        { freq: 830.61, time: 0.12, dur: 0.50, gain: 0.35 }, // G#5
        { freq: 987.77, time: 0.24, dur: 0.55, gain: 0.40 }, // B5
        { freq: 1318.51, time: 0.36, dur: 0.65, gain: 0.45 }, // E6 Crystal chime
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(note.freq * 2, now + note.time);

        const startTime = now + note.time;
        const endTime = startTime + note.dur;

        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.linearRampToValueAtTime(note.gain, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gainNode);
        overtone.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        overtone.start(startTime);
        osc.stop(endTime);
        overtone.stop(endTime);
      });
      return;
    }
  } catch (err) {
    console.warn('Web Audio synthesis error, attempting HTML5 Audio fallback:', err);
  }

  // Fallback: HTML5 Audio
  try {
    const audio = new Audio('/notification.wav');
    audio.volume = 0.8;
    audio.play().catch(() => {
      // Autoplay restriction or user hasn't interacted with page yet
    });
  } catch {
    // Graceful silence if browser blocks audio
  }
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
