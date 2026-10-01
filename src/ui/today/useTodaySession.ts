import { useReducer, useState } from 'react';
import type { TodayReview, TodaySnapshot } from '../../application/today-review';
import type { Card } from '../../domain/deck';
import type { CardProgress, Rating } from '../../domain/review';
import { advanceTodayQueue, countDueTomorrow, type TodayQueue } from '../../domain/today-queue';

type SessionState = {
  readonly queue: TodayQueue;
  readonly progressByCardId: ReadonlyMap<string, CardProgress>;
  /** Moment où la réponse a été révélée ; sert de référence aux intervalles affichés. */
  readonly revealedAt: Date | null;
};

type SessionAction = { readonly type: 'revealed'; readonly at: Date } | { readonly type: 'rated'; readonly progress: CardProgress; readonly at: Date };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'revealed':
      return state.revealedAt === null ? { ...state, revealedAt: action.at } : state;
    case 'rated':
      return {
        queue: advanceTodayQueue(state.queue, action.progress.dueAt, action.at),
        progressByCardId: new Map(state.progressByCardId).set(action.progress.cardId, action.progress),
        revealedAt: null,
      };
  }
}

export type SaveStatus = 'idle' | 'saving' | 'failed';

/** État de la session de révision : carte courante, révélation, notation. */
export function useTodaySession(todayReview: TodayReview, snapshot: TodaySnapshot, loadedAt: Date) {
  const [state, dispatch] = useReducer(sessionReducer, snapshot, (initial): SessionState => ({
    queue: initial.queue,
    progressByCardId: initial.progressByCardId,
    revealedAt: null,
  }));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const currentCard: Card | undefined = state.queue.pending[0];
  const currentProgress = currentCard === undefined ? undefined : state.progressByCardId.get(currentCard.id);
  const dueDates =
    currentCard !== undefined && state.revealedAt !== null
      ? todayReview.previewDueDates(currentCard, currentProgress, state.revealedAt)
      : null;

  const isNew = (card: Card): boolean => !state.progressByCardId.has(card.id);
  const allCards = snapshot.decks.flatMap((deck) => deck.cards);

  function reveal(): void {
    if (currentCard !== undefined) dispatch({ type: 'revealed', at: new Date() });
  }

  /** Enregistre la note ; renvoie false si l'enregistrement a échoué (la carte reste affichée). */
  async function rate(rating: Rating): Promise<boolean> {
    if (currentCard === undefined || state.revealedAt === null || saveStatus === 'saving') return false;
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
    currentCard,
    revealedAt: state.revealedAt,
    dueDates,
    saveStatus,
    reveal,
    rate,
    reviewedCount: state.queue.reviewedCount,
    remainingNewCount: state.queue.pending.filter(isNew).length,
    remainingReviewCount: state.queue.pending.filter((card) => !isNew(card)).length,
    dueTomorrow: countDueTomorrow(state.progressByCardId, loadedAt),
    unseenCount: allCards.filter(isNew).length,
    seenCardCount: state.progressByCardId.size,
    progressByCardId: state.progressByCardId,
    cards: allCards,
  };
}

export type TodaySession = ReturnType<typeof useTodaySession>;
