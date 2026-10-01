import { useEffect } from 'react';
import { startOfReviewDay } from '../../domain/today-queue';

/**
 * Sur téléphone, le navigateur garde la page ouverte en arrière-plan pendant des jours.
 * Au retour sur la page, si la journée de révision a changé depuis le chargement,
 * on recharge pour composer la session du nouveau jour au lieu d'afficher celle de la veille.
 */
export function useReloadOnNewReviewDay(loadedAt: Date): void {
  useEffect(() => {
    const loadedReviewDay = startOfReviewDay(loadedAt).getTime();

    const reloadIfNewReviewDay = () => {
      if (document.visibilityState === 'visible' && startOfReviewDay(new Date()).getTime() !== loadedReviewDay) {
        window.location.reload();
      }
    };

    document.addEventListener('visibilitychange', reloadIfNewReviewDay);
    return () => document.removeEventListener('visibilitychange', reloadIfNewReviewDay);
  }, [loadedAt]);
}
