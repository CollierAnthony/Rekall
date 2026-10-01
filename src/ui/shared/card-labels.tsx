import type { CardDifficulty, CardKind } from '../../domain/deck';

export const KIND_LABELS: Readonly<Record<CardKind, string>> = {
  recall: 'Rappel',
  compare: 'Comparaison',
  code: 'Code',
};

export const DIFFICULTY_LABELS: Readonly<Record<CardDifficulty, string>> = {
  1: 'Facile',
  2: 'Intermédiaire',
  3: 'Avancé',
};

/** Trois points, autant d'allumés que la difficulté ; le libellé reste lisible par les lecteurs d'écran. */
export function DifficultyDots({ level }: { readonly level: CardDifficulty }) {
  return (
    <span className="difficulty-label" title={`Difficulté ${level} sur 3`}>
      <span className="difficulty" aria-hidden="true">
        {([1, 2, 3] as const).map((dot) => (
          <span key={dot} className={dot <= level ? 'difficulty__dot difficulty__dot--on' : 'difficulty__dot'} />
        ))}
      </span>
      <span className="visually-hidden">{DIFFICULTY_LABELS[level]}</span>
    </span>
  );
}
