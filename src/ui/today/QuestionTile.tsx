import type { Card, CardKind } from '../../domain/deck';
import type { CardContext } from './card-contexts';

const KIND_LABELS: Readonly<Record<CardKind, string>> = {
  recall: 'Rappel',
  compare: 'Comparaison',
  code: 'Code',
};

const DIFFICULTY_LABELS = { 1: 'Facile', 2: 'Intermédiaire', 3: 'Avancé' } as const;

type QuestionTileProps = {
  readonly card: Card;
  readonly context: CardContext;
  /** hero : la question seule à l'écran ; compact : rappel de la question au-dessus de la réponse. */
  readonly size: 'hero' | 'compact';
  /** Couleur du mode : accent pour la révision, orange pour l'entretien. */
  readonly tone?: 'review' | 'interview';
};

/** Tuile de couleur qui porte la question, son contexte et son extrait de code. */
export function QuestionTile({ card, context, size, tone = 'review' }: QuestionTileProps) {
  const headingId = `question-${card.id}`;

  return (
    <article className={`question-tile question-tile--${size} question-tile--${tone}`} aria-labelledby={headingId}>
      <div className="question-tile__meta">
        <span>
          {context.deckTitle} · {context.moduleTitle}
        </span>
        <span className="question-tile__chips">
          <span className="chip">{KIND_LABELS[card.kind]}</span>
          <span className="chip" title={`Difficulté ${card.difficulty} sur 3`}>
            <span className="difficulty" aria-hidden="true">
              {([1, 2, 3] as const).map((level) => (
                <span key={level} className={level <= card.difficulty ? 'difficulty__dot difficulty__dot--on' : 'difficulty__dot'} />
              ))}
            </span>
            <span className="visually-hidden">{DIFFICULTY_LABELS[card.difficulty]}</span>
          </span>
          {card.since !== undefined && <span className="chip">{card.since}</span>}
          {card.deprecated !== undefined && (
            <span className="chip" title={card.deprecated.replacement === undefined ? undefined : `Remplacée par ${card.deprecated.replacement}`}>
              Dépréciée depuis {card.deprecated.since}
            </span>
          )}
        </span>
      </div>
      <h2 id={headingId} className="question-tile__question">
        {card.question}
      </h2>
      {card.code !== undefined && (
        <pre className="code">
          <code>{card.code}</code>
        </pre>
      )}
    </article>
  );
}
