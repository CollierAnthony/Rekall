import { deckIndexFileSchema, formatSchemaIssues } from './deck-file-schemas';
import { InvalidDeckFileError } from './invalid-deck-file-error';

/**
 * Lit l'index des decks : la liste des fichiers de deck à charger.
 * Ajouter une techno = ajouter son fichier dans cette liste, sans toucher au code.
 */
export function parseDeckIndexFile(content: unknown, fileName: string): readonly string[] {
  const result = deckIndexFileSchema.safeParse(content);
  if (!result.success) throw new InvalidDeckFileError(fileName, formatSchemaIssues(result.error));
  return result.data.deckFiles;
}
