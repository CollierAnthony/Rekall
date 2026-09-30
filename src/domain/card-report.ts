export type CardReportReason = 'wrong' | 'unclear' | 'other';

/** Signalement d'une carte fausse ou floue, pour correction ultérieure. */
export type CardReport = {
  readonly cardId: string;
  readonly reason: CardReportReason;
  readonly comment: string;
  readonly reportedAt: Date;
};
