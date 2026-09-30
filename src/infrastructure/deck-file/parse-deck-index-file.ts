import { FieldReader } from './field-reader';
import { InvalidDeckFileError } from './invalid-deck-file-error';

const DECK_FILE_NAME = /^[a-z0-9-]+\.json$/;

/**
 * Lit l'index des decks : la liste des fichiers de deck à charger.
 * Ajouter une techno = ajouter son fichier dans cette liste, sans toucher au code.
 */
export function parseDeckIndexFile(content: unknown, fileName: string): readonly string[] {
  const reader = new FieldReader();
  const fields = reader.record(content, 'index');
  const deckFiles = reader.textList(fields, 'deckFiles', 'index');

  deckFiles.forEach((deckFile, index) => {
    if (!DECK_FILE_NAME.test(deckFile)) reader.report(`index.deckFiles[${index}]`, 'nom de fichier attendu, ex. "react.json"');
  });
  if (new Set(deckFiles).size !== deckFiles.length) reader.report('index.deckFiles', 'un fichier est listé plusieurs fois');

  if (reader.issues.length > 0) throw new InvalidDeckFileError(fileName, reader.issues);
  return deckFiles;
}
