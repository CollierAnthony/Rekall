import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Compte à rebours démarré au montage du composant. Renvoie le temps restant en ms
 * et appelle `onTimeUp` une fois arrivé à zéro. Calculé depuis une échéance fixe,
 * pour ne pas dériver si le navigateur ralentit les timers.
 */
export function useCountdown(durationMs: number, onTimeUp: () => void): number {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const notifyTimeUp = useEffectEvent(onTimeUp);

  useEffect(() => {
    const deadline = Date.now() + durationMs;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now());
      setRemainingMs(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        notifyTimeUp();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [durationMs]);

  return remainingMs;
}
