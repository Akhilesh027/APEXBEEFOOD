import React, { useEffect, useRef } from 'react';

interface NotificationSoundProps {
  play: boolean;
}

export const NotificationSound: React.FC<NotificationSoundProps> = ({ play }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (play) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioCtxRef.current = ctx;

          // Synthesize a double-beep order chime
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(880, now); // A5 note
          osc1.frequency.setValueAtTime(1174.66, now + 0.15); // D6 note

          gain1.gain.setValueAtTime(0.3, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

          osc1.connect(gain1);
          gain1.connect(ctx.destination);

          osc1.start(now);
          osc1.stop(now + 0.5);
        }
      } catch (err) {
        console.warn('Audio chime playback blocked or unavailable:', err);
      }
    }
  }, [play]);

  return null;
};
