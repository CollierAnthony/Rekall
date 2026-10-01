import type { Card } from '../../domain/deck';
import type { Rating } from '../../domain/review';
import { Icon } from '../shared/Icon';
import type { CardContext } from './card-contexts';
import { KeyPointChecklist } from './KeyPointChecklist';
import { QuestionTile } from './QuestionTile';
import { RatingDock } from './RatingDock';
import { SourceLink } from './SourceLink';
import type { SaveStatus } from './useTodaySession';

/** Découpe « details » en paragraphes ; un bloc qui contient des retours à la ligne est du code. */
function detailBlocks(details: string): { readonly text: string; readonly isCode: boolean }[] {
  return details.split('\n\n').map((text) => ({ text, isCode: text.includes('\n') }));
}

type AnswerViewProps = {
  readonly card: Card;
  readonly context: CardContext;
  readonly revealedAt: Date;
  readonly dueDates: Readonly<Record<Rating, Date>>;
  readonly saveStatus: SaveStatus;
  readonly onRate: (rating: Rating) => void;
  readonly onReport: () => void;
};

/**
 * La réponse révélée. Sur téléphone, tout s'empile (l'ordre visuel est fixé en CSS) et la
 * notation reste en bas de l'écran ; sur ordinateur, deux colonnes : la réponse à gauche,
 * les points clés et la notation à droite.
 */
export function AnswerView({ card, context, revealedAt, dueDates, saveStatus, onRate, onReport }: AnswerViewProps) {
  return (
    <div className="review review--answer">
      <div className="answer-layout__main">
        <QuestionTile card={card} context={context} size="compact" />

        <section className="tile answer-tile" aria-label="Réponse">
          <p className="tile__eyebrow">Réponse</p>
          <p className="answer-tile__text">{card.answer}</p>
        </section>

        {card.pitfalls !== undefined && (
          <section className="tile tile--warning pitfalls" aria-labelledby={`pitfalls-${card.id}`}>
            <h3 id={`pitfalls-${card.id}`} className="tile__title">
              {card.pitfalls.length > 1 ? 'Pièges' : 'Piège'}
            </h3>
            <ul className="pitfalls__list">
              {card.pitfalls.map((pitfall) => (
                <li key={pitfall}>{pitfall}</li>
              ))}
            </ul>
          </section>
        )}

        {card.details !== undefined && (
          <details className="tile details">
            <summary className="details__summary">
              Pour creuser
              <Icon name="chevronDown" />
            </summary>
            <div className="details__body">
              {detailBlocks(card.details).map((block) =>
                block.isCode ? (
                  <pre key={block.text} className="code">
                    <code>{block.text}</code>
                  </pre>
                ) : (
                  <p key={block.text}>{block.text}</p>
                ),
              )}
            </div>
          </details>
        )}

        <SourceLink card={card} />

        <button type="button" className="link-button report-link" onClick={onReport}>
          <Icon name="flag" size={16} />
          Signaler cette carte
        </button>
      </div>

      <div className="answer-layout__side">
        <KeyPointChecklist keyPoints={card.keyPoints} idPrefix={`keypoints-${card.id}`} />
        <RatingDock
          revealedAt={revealedAt}
          dueDates={dueDates}
          isSaving={saveStatus === 'saving'}
          saveFailed={saveStatus === 'failed'}
          onRate={onRate}
        />
      </div>
    </div>
  );
}
