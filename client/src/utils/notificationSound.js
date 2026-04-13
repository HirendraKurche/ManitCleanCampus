// utils/notificationSound.js
// Plays a pleasant, crisp notification chime using the Web Audio API.
// No external audio file required — sound is synthesised in the browser.
// Works on all modern browsers; silently does nothing if Web Audio is unavailable.

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/**
 * Play an app-like crisp chime.
 * Call this whenever the unread notification count increases.
 */
export function playNotificationSound() {
  const ctx = getCtx();
  if (!ctx) return;

  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  // Real app-like notification sequence (Crisp double ding: C6 -> E6)
  const notes = [
    { freq: 1046.50, start: 0,    duration: 0.08, vol: 0.2 },
    { freq: 1318.51, start: 0.12, duration: 0.35, vol: 0.2 },
  ];

  notes.forEach(({ freq, start, duration, vol }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    // Sharp attack + exponential decay envelope for bell-like tone
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(vol, now + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  });
}
