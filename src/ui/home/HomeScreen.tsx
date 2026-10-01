import type { StorageMode } from '../../composition-root';
import type { DeckProgress } from '../../domain/deck-progress';
import { ANSWER_TIME_LIMIT_SECONDS, INTERVIEW_UNLOCK_THRESHOLD, QUESTIONS_PER_INTERVIEW } from '../../domain/interview';
import { formatDay, plural } from '../format';
import { Icon } from '../shared/Icon';
import { StatTile } from '../shared/StatTile';
import { StorageStatus } from '../shared/StorageStatus';

/** Ce que l'accueil montre de la journée de révision. */
export type TodayOverview = {
  readonly remainingReviewCount: number;
  readonly remainingNewCount: number;
  /** Cartes revues depuis le début de la journée de révision, rechargements compris. */
  readonly reviewedToday: number;
  readonly dueTomorrow: number;
};

type HomeScreenProps = {
  readonly reviewDay: Date;
  readonly storageMode: StorageMode;
  readonly today: TodayOverview;
  readonly interviewUnlocked: boolean;
  readonly seenCardCount: number;
  readonly deckProgress: readonly DeckProgress[];
  readonly onStartSession: () => void;
  readonly onStartInterview: () => void;
};

/** Accueil : la session du jour, l'entretien, demain, et l'avancement par catégorie. */
export function HomeScreen({ reviewDay, storageMode, today, interviewUnlocked, seenCardCount, deckProgress, onStartSession, onStartInterview }: HomeScreenProps) {
  return (
    <main className="home">
      <header className="home__header">
        <div className="home__topline">
          <p className="home__date">{formatDay(reviewDay)}</p>
          <StorageStatus mode={storageMode} />
        </div>
        <h1 className="home__title">Aujourd’hui</h1>
      </header>

      <div className="home__grid">
        <SessionTile today={today} onStart={onStartSession} />
        <div className="home__side">
          <div className="tile-grid">
            <InterviewTile unlocked={interviewUnlocked} seenCardCount={seenCardCount} onStart={onStartInterview} />
            <StatTile
              label="Demain"
              value={today.dueTomorrow}
              unit={today.dueTomorrow > 1 ? 'cartes à revoir' : 'carte à revoir'}
            />
          </div>
          <Categories deckProgress={deckProgress} />
        </div>
      </div>
    </main>
  );
}

function SessionTile({ today, onStart }: { readonly today: TodayOverview; readonly onStart: () => void }) {
  const pendingCount = today.remainingReviewCount + today.remainingNewCount;

  if (pendingCount === 0) {
    const hasReviewed = today.reviewedToday > 0;
    return (
      <section className="hero-tile hero-tile--review session-tile" aria-labelledby="session-title">
        <h2 id="session-title" className="hero-tile__eyebrow">
          {hasReviewed ? 'Session terminée' : 'Rien à réviser'}
        </h2>
        <p className="hero-tile__figure">
          <span className="hero-tile__number">{today.reviewedToday}</span>
          <span className="hero-tile__unit">{today.reviewedToday > 1 ? 'cartes révisées' : 'carte révisée'}</span>
        </p>
        <p className="hero-tile__note">{hasReviewed ? 'Reviens demain pour la suite.' : 'Toutes tes cartes sont à jour.'}</p>
      </section>
    );
  }

  return (
    <section className="hero-tile hero-tile--review session-tile" aria-labelledby="session-title">
      <h2 id="session-title" className="hero-tile__eyebrow">
        Session du jour
      </h2>
      <div className="hero-tile__figure">
        <span className="hero-tile__number">{pendingCount}</span>
        <div className="hero-tile__aside">
          <span className="hero-tile__unit">{pendingCount > 1 ? 'cartes' : 'carte'}</span>
          <div className="chips">
            {today.remainingReviewCount > 0 && <span className="chip">{plural(today.remainingReviewCount, 'à revoir', 'à revoir')}</span>}
            {today.remainingNewCount > 0 && <span className="chip">{plural(today.remainingNewCount, 'nouvelle', 'nouvelles')}</span>}
            {today.reviewedToday > 0 && <span className="chip">{plural(today.reviewedToday, 'faite', 'faites')}</span>}
          </div>
        </div>
      </div>
      <button type="button" className="button button--on-review button--block" onClick={onStart}>
        {today.reviewedToday > 0 ? 'Reprendre' : 'Commencer'}
        <Icon name="arrow" strokeWidth={2.4} />
      </button>
    </section>
  );
}

type InterviewTileProps = {
  readonly unlocked: boolean;
  readonly seenCardCount: number;
  readonly onStart: () => void;
};

/** Verrouillée, la tuile montre la progression vers le seuil au lieu d'être cachée. */
function InterviewTile({ unlocked, seenCardCount, onStart }: InterviewTileProps) {
  if (unlocked) {
    return (
      <button type="button" className="interview-tile" onClick={onStart}>
        <Icon name="timer" size={28} />
        <span className="interview-tile__text">
          <span className="interview-tile__title">Entretien</span>
          <span className="interview-tile__meta">
            {QUESTIONS_PER_INTERVIEW} questions · {ANSWER_TIME_LIMIT_SECONDS} s
          </span>
        </span>
      </button>
    );
  }

  const percent = Math.round(Math.min(1, seenCardCount / INTERVIEW_UNLOCK_THRESHOLD) * 100);
  return (
    <div className="tile interview-tile interview-tile--locked">
      <span className="interview-tile__top">
        <Icon name="lock" size={24} />
        <span>
          {seenCardCount} / {INTERVIEW_UNLOCK_THRESHOLD}
        </span>
      </span>
      <span className="interview-tile__text">
        <span className="interview-tile__title">Entretien</span>
        <span className="interview-tile__meta">S’ouvre à {INTERVIEW_UNLOCK_THRESHOLD} cartes vues</span>
        <span className="mini-bar" aria-hidden="true">
          <span className="mini-bar__fill" style={{ width: `${percent}%` }} />
        </span>
      </span>
    </div>
  );
}

function Categories({ deckProgress }: { readonly deckProgress: readonly DeckProgress[] }) {
  return (
    <section className="categories" aria-labelledby="categories-title">
      <h2 id="categories-title" className="section-title">
        Catégories
      </h2>
      <ul className="category-list">
        {deckProgress.map(({ deck, seenCount }) => (
          <li key={deck.id} className="tile category">
            <span className="category__swatch" aria-hidden="true" />
            <span className="category__body">
              <span className="category__row">
                <span className="category__title">{deck.title}</span>
                <span className="category__count">
                  {seenCount} / {deck.cards.length} vues
                </span>
              </span>
              <span className="bar" aria-hidden="true">
                <span className="bar__fill" style={{ width: `${deck.cards.length === 0 ? 0 : Math.round((seenCount / deck.cards.length) * 100)}%` }} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
