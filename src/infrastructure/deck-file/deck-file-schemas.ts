import { z, type ZodError } from 'zod';

const text = z.string().trim().min(1);
const textList = z.array(text).min(1);

// strictObject partout : une clé inconnue (ex. "pitfals") est une erreur au lieu d'être ignorée en silence.
const cardCommonShape = {
  id: text,
  moduleId: text,
  question: text,
  answer: text,
  details: text.optional(),
  keyPoints: textList,
  pitfalls: textList.optional(),
  source: z.strictObject({ title: text, url: z.url({ protocol: /^https$/ }) }),
  since: text.optional(),
  deprecated: z.strictObject({ since: text, replacement: text.optional() }).optional(),
  difficulty: z.literal([1, 2, 3]),
};

const cardSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...cardCommonShape, kind: z.literal(['recall', 'compare']), code: text.optional() }),
  z.strictObject({ ...cardCommonShape, kind: z.literal('code'), code: text }),
]);

export const deckFileSchema = z.strictObject({
  id: text,
  title: text,
  version: text,
  modules: z.array(z.strictObject({ id: text, title: text })),
  cards: z.array(cardSchema),
});

export const deckIndexFileSchema = z.strictObject({
  deckFiles: z
    .array(z.string().regex(/^[a-z0-9-]+\.json$/, { error: 'nom de fichier attendu, ex. "react.json"' }))
    .min(1)
    .refine((deckFiles) => new Set(deckFiles).size === deckFiles.length, { error: 'un fichier est listé plusieurs fois' }),
});

/** Transforme une erreur Zod en lignes lisibles : "cards[0].question : <message>". */
export function formatSchemaIssues(error: ZodError): string[] {
  return error.issues.map((issue) => `${formatPath(issue.path)} : ${issue.message}`);
}

function formatPath(path: readonly PropertyKey[]): string {
  const formatted = path.map((segment) => (typeof segment === 'number' ? `[${segment}]` : `.${String(segment)}`)).join('');
  if (formatted === '') return '(racine)';
  return formatted.startsWith('.') ? formatted.slice(1) : formatted;
}
