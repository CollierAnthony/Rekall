import type { CardReport } from '../../domain/card-report';

export type CardReportDocument = {
  readonly cardId: string;
  readonly reason: string;
  readonly comment: string;
  readonly reportedAt: string;
};

export function toCardReportDocument(report: CardReport): CardReportDocument {
  return { cardId: report.cardId, reason: report.reason, comment: report.comment, reportedAt: report.reportedAt.toISOString() };
}
