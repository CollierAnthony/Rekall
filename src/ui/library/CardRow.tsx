import type { CardStatus } from '../../domain/card-status';
import type { Card } from '../../domain/deck';
import { formatInterval } from '../format';
import { DifficultyDots, KIND_LABELS } from '../shared/card-labels';
import type { CardContext } from '../today/card-contexts';

/** « Nouvelle », « À revoir » ou « Dans 3 j ». */
export function StatusPill({ status, now }: { readonly status: CardStatus; readonly now: Date }) {
  switch (status.kind) {
    case 'new':
      return <span className="status status--new">Nouvelle</span>;
    case 'due':
      return <span className="status status--due">À revoir</span>;
    case 'scheduled':
      return <span className="status">Dans {formatInterval(now, status.dueAt)}</span>;
  }
}

type CardRowProps = {
  readonly card: Card;
  readonly status: CardStatus;
  readonly now: Date;
  /** Affiché dans les résultats de recherche, où les cartes ne sont plus rangées par module. */
  readonly context?: CardContext;
  readonly onOpen: (cardId: string) => void;
};

/** Une carte dans la liste : la question, où elle en est, son type et sa difficulté. */
export function CardRow({ card, status, now, context, onOpen }: CardRowProps) {
  return (
    <button type="button" className="card-row" onClick={() => onOpen(card.id)}>
      {context !== undefined && (
        <span className="card-row__context">
          {context.deckTitle} · {context.moduleTitle}
        </span>
      )}
      <span className="card-row__question">{card.question}</span>
      <span className="card-row__meta">
        <StatusPill status={status} now={now} />
        {card.kind !== 'recall' && <span className="chip">{KIND_LABELS[card.kind]}</span>}
        <span className="card-row__difficulty">
          <DifficultyDots level={card.difficulty} />
        </span>
      </span>
    </button>
  );
}
