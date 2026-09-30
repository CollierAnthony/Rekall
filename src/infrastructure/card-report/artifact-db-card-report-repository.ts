import type { CardReportRepository } from '../../application/ports/card-report-repository';
import type { CardReport } from '../../domain/card-report';
import type { ArtifactCollectionReference, ArtifactStorage } from '../artifact-runtime/artifact-runtime';
import { toCardReportDocument } from './card-report-document';

/** Signalements dans une collection partagée `reports`, lisible par Claude pour corriger les cartes. */
export class ArtifactDbCardReportRepository implements CardReportRepository {
  readonly #reports: ArtifactCollectionReference;

  constructor(storage: ArtifactStorage) {
    this.#reports = storage.db.collection('reports');
  }

  async save(report: CardReport): Promise<void> {
    await this.#reports.add(toCardReportDocument(report));
  }
}
