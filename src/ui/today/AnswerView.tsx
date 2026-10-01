import type { Card } from '../../domain/deck';
import type { Rating } from '../../domain/review';
import { Icon } from '../shared/Icon';
import type { CardContext } from './card-contexts';
import { AnswerTile, DetailsTile, PitfallsTile } from './CardSections';
import { KeyPointChecklist } from './KeyPointChecklist';
import { QuestionTile } from './QuestionTile';
import { RatingDock } from './RatingDock';
import { SourceLink } from './SourceLink';
import type { SaveStatus } from './useTodaySession';

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
        <AnswerTile card={card} />
        <PitfallsTile card={card} />
        <DetailsTile card={card} />
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
