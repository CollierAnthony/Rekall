import { INTERVIEW_UNLOCK_THRESHOLD } from '../../domain/interview';
import { Icon } from '../shared/Icon';
import { StatTile } from '../shared/StatTile';

type SessionDoneProps = {
  readonly reviewedToday: number;
  readonly dueTomorrow: number;
  readonly unseenCount: number;
  readonly newCardsPerDay: number;
  readonly interviewUnlocked: boolean;
  readonly seenCardCount: number;
  readonly onStartInterview: () => void;
  readonly onExit: () => void;
};

/** Fin de la session du jour : le bilan, ce qui attend demain, et la suite possible. */
export function SessionDone({
  reviewedToday,
  dueTomorrow,
  unseenCount,
  newCardsPerDay,
  interviewUnlocked,
  seenCardCount,
  onStartInterview,
  onExit,
}: SessionDoneProps) {
  const upcomingNew = Math.min(unseenCount, newCardsPerDay);

  return (
    <div className="review review--done" aria-live="polite">
      <section className="hero-tile hero-tile--review" aria-labelledby="done-title">
        <h2 id="done-title" className="hero-tile__eyebrow">
          Session terminée
        </h2>
        <p className="hero-tile__figure">
          <span className="hero-tile__number">{reviewedToday}</span>
          <span className="hero-tile__unit">{reviewedToday > 1 ? 'cartes révisées' : 'carte révisée'} aujourd’hui</span>
        </p>
      </section>

      <div className="tile-grid">
        <StatTile label="Demain" value={dueTomorrow} unit={dueTomorrow > 1 ? 'cartes à revoir' : 'carte à revoir'} />
        <StatTile
          label="Nouvelles"
          value={upcomingNew}
          unit={upcomingNew > 0 ? `par jour · ${unseenCount} en réserve` : 'toutes les cartes ont été vues'}
        />
      </div>

      <div className="review__footer">
        {interviewUnlocked ? (
          <button type="button" className="button button--interview button--block" onClick={onStartInterview}>
            <Icon name="timer" strokeWidth={2.2} />
            S’entraîner en entretien
          </button>
        ) : (
          <p className="hint">
            L’entretien s’ouvre à {INTERVIEW_UNLOCK_THRESHOLD} cartes vues ({seenCardCount} / {INTERVIEW_UNLOCK_THRESHOLD}).
          </p>
        )}
        <button type="button" className="button button--ghost button--block" onClick={onExit}>
          Retour à l’accueil
        </button>
      </div>
    </div>
  );
}
