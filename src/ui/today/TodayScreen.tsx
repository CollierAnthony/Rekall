import { useEffect, useEffectEvent, useRef } from 'react';
import type { TodayReview } from '../../application/today-review';
import { RATINGS, type Rating } from '../../domain/review';
import { ReviewCard, type CardContext } from './ReviewCard';
import { SessionProgress } from './SessionProgress';
import { SessionSummary } from './SessionSummary';
import type { TodaySession } from './useTodaySession';

type TodayScreenProps = {
  readonly session: TodaySession;
  readonly todayReview: TodayReview;
  readonly cardContexts: ReadonlyMap<string, CardContext>;
  readonly newCardsPerDay: number;
};

const RATING_BY_KEY: Readonly<Record<string, Rating>> = Object.fromEntries(RATINGS.map((rating, index) => [String(index + 1), rating]));

export function TodayScreen({ session, todayReview, cardContexts, newCardsPerDay }: TodayScreenProps) {
  const cardTopRef = useRef<HTMLDivElement>(null);

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
    <div className="today">
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
    </div>
  );
}
