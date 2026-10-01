import { useEffect, useEffectEvent, useState } from 'react';
import type { TodayReview } from '../../application/today-review';
import { RATINGS, type Rating } from '../../domain/review';
import { FocusHeader } from '../shared/FocusHeader';
import { Icon } from '../shared/Icon';
import { AnswerView } from './AnswerView';
import type { CardContext } from './card-contexts';
import { QuestionView } from './QuestionView';
import { ReportSheet } from './ReportSheet';
import { SessionDone } from './SessionDone';
import type { TodaySession } from './useTodaySession';

type ReviewSessionProps = {
  readonly session: TodaySession;
  readonly todayReview: TodayReview;
  readonly cardContexts: ReadonlyMap<string, CardContext>;
  readonly reviewedToday: number;
  readonly newCardsPerDay: number;
  readonly interviewUnlocked: boolean;
  readonly onExit: () => void;
  readonly onStartInterview: () => void;
};

const RATING_BY_KEY: Readonly<Record<string, Rating>> = Object.fromEntries(RATINGS.map((rating, index) => [String(index + 1), rating]));

/** Session de révision en mode focus : une carte à la fois, sans navigation autour. */
export function ReviewSession({
  session,
  todayReview,
  cardContexts,
  reviewedToday,
  newCardsPerDay,
  interviewUnlocked,
  onExit,
  onStartInterview,
}: ReviewSessionProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const card = session.currentCard;
  const context = card === undefined ? undefined : cardContexts.get(card.id);

  async function rateAndScrollUp(rating: Rating): Promise<void> {
    if (await session.rate(rating)) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }

  // Raccourcis : Espace ou Entrée pour révéler, 1 à 4 pour noter, Échap pour sortir. L'Effect Event lit
  // toujours l'état courant sans que l'écouteur soit réinscrit à chaque rendu.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isReportOpen || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onExit();
      return;
    }
    if (card === undefined) return;
    if ((event.key === ' ' || event.key === 'Enter') && session.revealedAt === null) {
      if (target instanceof HTMLButtonElement) return; // le bouton gère déjà sa propre activation
      event.preventDefault();
      session.reveal();
      return;
    }
    const rating = RATING_BY_KEY[event.key];
    if (rating !== undefined && session.revealedAt !== null) {
      event.preventDefault();
      void rateAndScrollUp(rating);
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const remaining = session.remainingNewCount + session.remainingReviewCount;
  const total = session.reviewedCount + remaining;
  const isDone = card === undefined || context === undefined;

  return (
    <div className="focus">
      <FocusHeader
        closeLabel="Quitter la session"
        onClose={onExit}
        step={isDone ? total : session.reviewedCount + 1}
        total={total}
        progress={total === 0 ? 1 : session.reviewedCount / total}
        action={
          isDone ? undefined : (
            <button type="button" className="round-button round-button--quiet" aria-label="Signaler la carte" onClick={() => setIsReportOpen(true)}>
              <Icon name="flag" size={19} />
            </button>
          )
        }
      />
      <main className="focus__main">
        {isDone ? (
          <SessionDone
            reviewedToday={reviewedToday}
            dueTomorrow={session.dueTomorrow}
            unseenCount={session.unseenCount}
            newCardsPerDay={newCardsPerDay}
            interviewUnlocked={interviewUnlocked}
            seenCardCount={session.seenCardCount}
            onStartInterview={onStartInterview}
            onExit={onExit}
          />
        ) : session.revealedAt === null || session.dueDates === null ? (
          <QuestionView key={card.id} card={card} context={context} onReveal={session.reveal} />
        ) : (
          <AnswerView
            key={card.id}
            card={card}
            context={context}
            revealedAt={session.revealedAt}
            dueDates={session.dueDates}
            saveStatus={session.saveStatus}
            onRate={(rating) => void rateAndScrollUp(rating)}
            onReport={() => setIsReportOpen(true)}
          />
        )}
      </main>
      {card !== undefined && (
        <ReportSheet cardId={card.id} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} onSubmit={(report) => todayReview.report(report)} />
      )}
    </div>
  );
}
