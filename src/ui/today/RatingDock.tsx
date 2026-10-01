import { RATINGS, type Rating } from '../../domain/review';
import { formatDueLabel } from '../format';

const RATING_LABELS: Readonly<Record<Rating, string>> = {
  again: 'Raté',
  hard: 'Difficile',
  good: 'Bon',
  easy: 'Facile',
};

type RatingDockProps = {
  readonly revealedAt: Date;
  readonly dueDates: Readonly<Record<Rating, Date>>;
  readonly isSaving: boolean;
  readonly saveFailed: boolean;
  readonly onRate: (rating: Rating) => void;
};

/** Les quatre notes, avec l'échéance de chacune. Fixées en bas de l'écran sur téléphone. */
export function RatingDock({ revealedAt, dueDates, isSaving, saveFailed, onRate }: RatingDockProps) {
  return (
    <section className="rating-dock" aria-labelledby="rating-prompt">
      <p id="rating-prompt" className="rating-dock__prompt">
        Comment ça s’est passé ?
      </p>
      {saveFailed && (
        <p className="rating-dock__error" role="alert">
          La note n’a pas été enregistrée. Vérifie ta connexion, puis note à nouveau.
        </p>
      )}
      <div className="rating-dock__buttons">
        {RATINGS.map((rating, index) => (
          <button
            key={rating}
            type="button"
            className={`rating-button rating-button--${rating}`}
            onClick={() => onRate(rating)}
            disabled={isSaving}
            aria-keyshortcuts={String(index + 1)}
          >
            <span className="rating-button__label">
              <kbd className="kbd">{index + 1}</kbd>
              {RATING_LABELS[rating]}
            </span>
            <span className="rating-button__due">{formatDueLabel(revealedAt, dueDates[rating])}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
