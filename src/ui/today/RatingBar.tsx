import { RATINGS, type Rating } from '../../domain/review';
import { formatDueLabel } from '../format';

const RATING_LABELS: Readonly<Record<Rating, string>> = {
  again: 'Raté',
  hard: 'Difficile',
  good: 'Bon',
  easy: 'Facile',
};

type RatingBarProps = {
  readonly revealedAt: Date;
  readonly dueDates: Readonly<Record<Rating, Date>>;
  readonly isSaving: boolean;
  readonly onRate: (rating: Rating) => void;
};

export function RatingBar({ revealedAt, dueDates, isSaving, onRate }: RatingBarProps) {
  return (
    <div className="rating" role="group" aria-labelledby="rating-prompt">
      <p id="rating-prompt" className="rating__prompt">
        Comment ça s’est passé ? <span className="rating__prompt-note">L’intervalle indique quand la carte reviendra.</span>
      </p>
      <div className="rating__buttons">
        {RATINGS.map((rating, index) => (
          <button
            key={rating}
            type="button"
            className={`rating__button rating__button--${rating}`}
            onClick={() => onRate(rating)}
            disabled={isSaving}
            aria-keyshortcuts={String(index + 1)}
          >
            <span className="rating__label">{RATING_LABELS[rating]}</span>
            <span className="rating__interval">{formatDueLabel(revealedAt, dueDates[rating])}</span>
            <kbd className="rating__key">{index + 1}</kbd>
          </button>
        ))}
      </div>
    </div>
  );
}
