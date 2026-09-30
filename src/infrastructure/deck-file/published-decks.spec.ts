/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDeckFile } from './parse-deck-file';
import { parseDeckIndexFile } from './parse-deck-index-file';

// Garde-fou sur le contenu : chaque deck publié doit passer le même parseur que l'appli.
const decksDirectory = new URL('../../../public/decks/', import.meta.url);
const readJson = (fileName: string): unknown => JSON.parse(readFileSync(new URL(fileName, decksDirectory), 'utf8'));

const deckFiles = parseDeckIndexFile(readJson('index.json'), 'index.json');

describe('decks publiés', () => {
  it.each(deckFiles)('%s est un deck valide dont l’id correspond au nom de fichier', (deckFile) => {
    const deck = parseDeckFile(readJson(deckFile), deckFile);

    expect(`${deck.id}.json`).toBe(deckFile);
  });
});
