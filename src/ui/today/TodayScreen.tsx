import { useEffect, useEffectEvent, useMemo, useRef } from 'react';
import type { TodayReview, TodaySnapshot } from '../../application/today-review';
import type { StorageMode } from '../../composition-root';
import { RATINGS, type Rating } from '../../domain/review';
import { startOfReviewDay } from '../../domain/today-queue';
import { formatDay } from '../format';
import { ReviewCard, type CardContext } from './ReviewCard';
import { SessionProgress } from './SessionProgress';
import { SessionSummary } from './SessionSummary';
import { StorageStatus } from './StorageStatus';
import { useReloadOnNewReviewDay } from './useReloadOnNewReviewDay';
import { useTodaySession } from './useTodaySession';

type TodayScreenProps = {
  readonly todayReview: TodayReview;
  readonly storageMode: StorageMode;
  readonly snapshot: TodaySnapshot;
  readonly loadedAt: Date;
  readonly newCardsPerDay: number;
};

const RATING_BY_KEY: Readonly<Record<string, Rating>> = Object.fromEntries(RATINGS.map((rating, index) => [String(index + 1), rating]));

export function TodayScreen({ todayReview, storageMode, snapshot, loadedAt, newCardsPerDay }: TodayScreenProps) {
  const session = useTodaySession(todayReview, snapshot, loadedAt);
  useReloadOnNewReviewDay(loadedAt);
  const cardTopRef = useRef<HTMLDivElement>(null);

  const cardContexts = useMemo(
    () =>
      new Map(
        snapshot.decks.flatMap((deck) => {
          const moduleTitles = new Map(deck.modules.map((deckModule) => [deckModule.id, deckModule.title]));
          return deck.cards.map((card): [string, CardContext] => [
            card.id,
            { deckTitle: deck.title, moduleTitle: moduleTitles.get(card.moduleId) ?? card.moduleId },
          ]);
        }),
      ),
    [snapshot.decks],
  );

  async function rateAndScroll(rating: Rating): Promise<void> {
    if (await session.rate(rating)) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      cardTopRef.current?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }

  // Raccourcis : Espace ou Entrée pour révéler, 1 à 4 pour noter. L'Effect Event lit toujours l'état courant
  // sans que l'écouteur soit réinscrit à chaque rendu.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;

    if ((event.key === ' ' || event.key === 'Enter') && session.revealedAt === null) {
      if (target instanceof HTMLButtonElement) return; // le bouton gère déjà sa propre activation
      event.preventDefault();
      session.reveal();
      return;
    }
    const rating = RATING_BY_KEY[event.key];
    if (rating !== undefined && session.revealedAt !== null) {
      event.preventDefault();
      void rateAndScroll(rating);
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const card = session.currentCard;
  const cardContext = card === undefined ? undefined : cardContexts.get(card.id);

  return (
    <main className="today">
      <header className="today__header">
        <div>
          <p className="today__date">{formatDay(startOfReviewDay(loadedAt))}</p>
          <h1 className="today__title">Aujourd’hui</h1>
        </div>
        <StorageStatus mode={storageMode} />
      </header>

      <SessionProgress
        reviewedCount={session.reviewedCount}
        remainingReviewCount={session.remainingReviewCount}
        remainingNewCount={session.remainingNewCount}
      />

      <div ref={cardTopRef} className="today__stage">
        {card !== undefined && cardContext !== undefined ? (
          <ReviewCard
            key={card.id}
            card={card}
            context={cardContext}
            revealedAt={session.revealedAt}
            dueDates={session.dueDates}
            saveStatus={session.saveStatus}
            onReveal={session.reveal}
            onRate={rateAndScroll}
            onReport={(report) => todayReview.report(report)}
          />
        ) : (
          <SessionSummary
            reviewedCount={session.reviewedCount}
            dueTomorrow={session.dueTomorrow}
            unseenCount={session.unseenCount}
            newCardsPerDay={newCardsPerDay}
          />
        )}
      </div>
    </main>
  );
}
