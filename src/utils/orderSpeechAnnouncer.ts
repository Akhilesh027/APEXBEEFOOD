/**
 * Web Audio Chime and Voice Speech Announcer for Restaurant POS and Waiter Calls.
 * Announces new dine-in table orders and waiter requests aloud.
 */

export const playKitchenChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.28); // D6

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch (e) {
    console.warn('Kitchen chime playback blocked:', e);
  }
};

export const announceOrderVoice = (tableNumber: string, itemsDescription: string, totalAmount?: number) => {
  // 1. Play the alert chime
  playKitchenChime();

  // 2. Announce verbally via Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();

      const tableLabel = tableNumber.toLowerCase().startsWith('table') ? tableNumber : `Table ${tableNumber}`;
      let text = `New order placed from ${tableLabel}. ${itemsDescription}.`;
      if (totalAmount && totalAmount > 0) {
        text += ` Total ${totalAmount} rupees.`;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Clear speaking pace
      utterance.pitch = 1.05; // Friendly and clear kitchen alert pitch
      utterance.lang = 'en-US';

      // Pick an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }
};

export const announceWaiterCallVoice = (tableNumber: string, reason: string) => {
  playKitchenChime();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();

      const tableLabel = tableNumber.toLowerCase().startsWith('table') ? tableNumber : `Table ${tableNumber}`;
      const text = `Service alert! ${tableLabel} is calling for ${reason}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.lang = 'en-US';

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }
};

export const announceReservationVoice = (guestName: string, guestCount: number, timeSlot: string) => {
  playKitchenChime();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();

      const text = `New table reservation received for ${guestName}, ${guestCount} guests at ${timeSlot}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }
};
