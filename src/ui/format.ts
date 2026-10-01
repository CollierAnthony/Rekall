import { startOfNextReviewDay } from '../domain/today-queue';

/**
 * Échéance affichée sous un bouton de note : « dans la session » si la carte revient
 * avant la fin de la journée de révision (étapes d'apprentissage), sinon « dans 8 j ».
 */
export function formatDueLabel(reviewedAt: Date, dueAt: Date): string {
  return dueAt < startOfNextReviewDay(reviewedAt) ? 'dans la session' : `dans ${formatInterval(reviewedAt, dueAt)}`;
}

/** Intervalle lisible entre deux dates : « 10 min », « 3 h », « 8 j », « 2 mois », « 1 an ». */
export function formatInterval(from: Date, to: Date): string {
  const minutes = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.round(hours / 24);
  if (days < 31) return `${days} j`;

  const months = Math.round(days / 30);
  if (months < 12) return `${months} mois`;

  const years = Math.round(days / 365);
  return years === 1 ? '1 an' : `${years} ans`;
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export function formatDay(date: Date): string {
  return dayFormat.format(date);
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}
