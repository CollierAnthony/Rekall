import { useReducer, useState } from 'react';
import type { TodayReview, TodaySnapshot } from '../../application/today-review';
import type { CardProgress, Rating } from '../../domain/review';
import {
  currentCardOf,
  recordRating,
  revealAnswer,
  startReviewSession,
  summarizeReviewSession,
  type ReviewSession,
} from '../../domain/review-session';

type SessionAction = { readonly type: 'revealed'; readonly at: Date } | { readonly type: 'rated'; readonly progress: CardProgress; readonly at: Date };

/** Le reducer ne fait que router vers les règles du domaine : il n'en contient aucune. */
function sessionReducer(session: ReviewSession, action: SessionAction): ReviewSession {
  switch (action.type) {
    case 'revealed':
      return revealAnswer(session, action.at);
    case 'rated':
      return recordRating(session, action.progress, action.at);
  }
}

export type SaveStatus = 'idle' | 'saving' | 'failed';

/** Branche la session de révision sur React : état, enregistrement asynchrone de la note et son statut. */
export function useTodaySession(todayReview: TodayReview, snapshot: TodaySnapshot, loadedAt: Date) {
  const [session, dispatch] = useReducer(sessionReducer, snapshot, (initial) => startReviewSession(initial.queue, initial.progressByCardId));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const currentCard = currentCardOf(session);
  const currentProgress = currentCard === undefined ? undefined : session.progressByCardId.get(currentCard.id);
  const dueDates =
    currentCard !== undefined && session.revealedAt !== null
      ? todayReview.previewDueDates(currentCard, currentProgress, session.revealedAt)
      : null;
  const cards = snapshot.decks.flatMap((deck) => deck.cards);

  function reveal(): void {
    dispatch({ type: 'revealed', at: new Date() });
  }

  /** Enregistre la note ; renvoie false si l'enregistrement a échoué (la carte reste affichée). */
  async function rate(rating: Rating): Promise<boolean> {
    if (currentCard === undefined || session.revealedAt === null || saveStatus === 'saving') return false;
    setSaveStatus('saving');
    try {
      const now = new Date();
      const progress = await todayReview.rate(currentCard, currentProgress, rating, now);
      dispatch({ type: 'rated', progress, at: now });
      setSaveStatus('idle');
      return true;
    } catch (error) {
      console.error('Enregistrement de la note impossible', error);
      setSaveStatus('failed');
      return false;
    }
  }

  return {
    ...summarizeReviewSession(session, cards, loadedAt),
    currentCard,
    revealedAt: session.revealedAt,
    dueDates,
    saveStatus,
    reveal,
    rate,
    progressByCardId: session.progressByCardId,
    cards,
  };
}

export type TodaySession = ReturnType<typeof useTodaySession>;
