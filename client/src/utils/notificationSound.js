// utils/notificationSound.js
// Plays a pleasant two-tone chime using the Web Audio API.
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
 * Play a short soft chime.
 * Call this whenever the unread notification count increases.
 */
export function playNotificationSound() {
  const ctx = getCtx();
  if (!ctx) return;

  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  // Two-note chime: high note then slightly lower note
  const notes = [
    { freq: 880, start: 0,    duration: 0.18 },
    { freq: 1046, start: 0.15, duration: 0.28 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    // Soft attack + decay envelope
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.18, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  });
}
