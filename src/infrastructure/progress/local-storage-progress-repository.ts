import type { ProgressRepository } from '../../application/ports/progress-repository';
import type { CardProgress } from '../../domain/review';
import { readJsonRecord, type KeyValueStorage } from '../browser-storage';
import { fromProgressDocument, toProgressDocument } from './progress-document';

const STORAGE_KEY = 'revisions-tech:progress:v1';

/** Progression gardée dans le navigateur : dev local, ou artefact sans accès à sa base. */
export class LocalStorageProgressRepository implements ProgressRepository {
  readonly #storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.#storage = storage;
  }

  async loadAll(): Promise<readonly CardProgress[]> {
    return Object.values(readJsonRecord(this.#storage, STORAGE_KEY)).flatMap((document) => {
      const progress = fromProgressDocument(document);
      return progress === null ? [] : [progress];
    });
  }

  async save(progress: CardProgress): Promise<void> {
    const documents = readJsonRecord(this.#storage, STORAGE_KEY);
    documents[progress.cardId] = toProgressDocument(progress);
    this.#storage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }
}
