import {
  findDeckInconsistencies,
  type Card,
  type CardDifficulty,
  type CardKind,
  type CardSource,
  type Deck,
  type DeckModule,
  type Deprecation,
} from '../../domain/deck';
import { FieldReader } from './field-reader';
import { InvalidDeckFileError } from './invalid-deck-file-error';

const CARD_KINDS: readonly [CardKind, ...CardKind[]] = ['recall', 'code', 'compare'];
const CARD_DIFFICULTIES: readonly [CardDifficulty, ...CardDifficulty[]] = [1, 2, 3];

/**
 * Convertit le contenu JSON d'un fichier de deck en Deck du domaine.
 * @throws InvalidDeckFileError avec la liste complète des problèmes de forme,
 * ou à défaut des incohérences du deck.
 */
export function parseDeckFile(content: unknown, fileName: string): Deck {
  const reader = new FieldReader();
  const fields = reader.record(content, 'deck');

  const deck: Deck = {
    id: reader.text(fields, 'id', 'deck'),
    title: reader.text(fields, 'title', 'deck'),
    version: reader.text(fields, 'version', 'deck'),
    modules: reader.list(fields, 'modules', 'deck').map((item, index) => parseModule(reader, item, `deck.modules[${index}]`)),
    cards: reader.list(fields, 'cards', 'deck').map((item, index) => parseCard(reader, item, `deck.cards[${index}]`)),
  };

  if (reader.issues.length > 0) throw new InvalidDeckFileError(fileName, reader.issues);

  const inconsistencies = findDeckInconsistencies(deck);
  if (inconsistencies.length > 0) throw new InvalidDeckFileError(fileName, inconsistencies);

  return deck;
}

function parseModule(reader: FieldReader, item: unknown, path: string): DeckModule {
  const fields = reader.record(item, path);
  return {
    id: reader.text(fields, 'id', path),
    title: reader.text(fields, 'title', path),
  };
}

function parseCard(reader: FieldReader, item: unknown, path: string): Card {
  const fields = reader.record(item, path);
  const id = reader.text(fields, 'id', path);
  const moduleId = reader.text(fields, 'moduleId', path);
  const kind = reader.oneOf(fields, 'kind', path, CARD_KINDS);
  const question = reader.text(fields, 'question', path);
  const code = reader.optionalText(fields, 'code', path);
  const answer = reader.text(fields, 'answer', path);
  const details = reader.optionalText(fields, 'details', path);
  const keyPoints = reader.textList(fields, 'keyPoints', path);
  const pitfalls = reader.optionalTextList(fields, 'pitfalls', path);
  const source = parseSource(reader, fields['source'], `${path}.source`);
  const since = reader.optionalText(fields, 'since', path);
  const deprecated = fields['deprecated'] === undefined ? undefined : parseDeprecation(reader, fields['deprecated'], `${path}.deprecated`);
  const difficulty = reader.oneOf(fields, 'difficulty', path, CARD_DIFFICULTIES);

  const commonFields = { id, moduleId, question, answer, details, keyPoints, pitfalls, source, since, deprecated, difficulty };

  if (kind === 'code') {
    if (code === undefined) reader.report(`${path}.code`, 'extrait de code requis pour une carte "code"');
    return { ...commonFields, kind, code: code ?? '' };
  }
  return { ...commonFields, kind, code };
}

function parseSource(reader: FieldReader, item: unknown, path: string): CardSource {
  const fields = reader.record(item, path);
  return {
    title: reader.text(fields, 'title', path),
    url: reader.httpsUrl(fields, 'url', path),
  };
}

function parseDeprecation(reader: FieldReader, item: unknown, path: string): Deprecation {
  const fields = reader.record(item, path);
  return {
    since: reader.text(fields, 'since', path),
    replacement: reader.optionalText(fields, 'replacement', path),
  };
}
