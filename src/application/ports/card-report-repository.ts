import type { CardReport } from '../../domain/card-report';

export interface CardReportRepository {
  save(report: CardReport): Promise<void>;
}
