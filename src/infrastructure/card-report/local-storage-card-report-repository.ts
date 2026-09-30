import type { CardReportRepository } from '../../application/ports/card-report-repository';
import type { CardReport } from '../../domain/card-report';
import { readJsonRecord, type KeyValueStorage } from '../browser-storage';
import { toCardReportDocument } from './card-report-document';

const STORAGE_KEY = 'revisions-tech:card-reports:v1';

export class LocalStorageCardReportRepository implements CardReportRepository {
  readonly #storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.#storage = storage;
  }

  async save(report: CardReport): Promise<void> {
    const documents = readJsonRecord(this.#storage, STORAGE_KEY);
    documents[`${report.cardId}@${report.reportedAt.toISOString()}`] = toCardReportDocument(report);
    this.#storage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }
}
