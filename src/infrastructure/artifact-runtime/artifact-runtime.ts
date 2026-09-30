/**
 * Sous-ensemble typé du runtime des artefacts claude.ai (capacités `db` et `user`)
 * dont l'appli a besoin. Absent en dev local : `window.claude` n'existe pas.
 */
export type ArtifactDocumentSnapshot = {
  readonly id: string;
  readonly exists: boolean;
  data(): Record<string, unknown> | undefined;
};

export type ArtifactDocumentReference = {
  set(data: Record<string, unknown>): Promise<void>;
  collection(path: string): ArtifactCollectionReference;
};

export type ArtifactCollectionReference = {
  get(): Promise<{ readonly docs: readonly ArtifactDocumentSnapshot[] }>;
  doc(id: string): ArtifactDocumentReference;
  add(data: Record<string, unknown>): Promise<unknown>;
};

export type ArtifactDb = {
  doc(path: string): ArtifactDocumentReference;
  collection(path: string): ArtifactCollectionReference;
};

type ArtifactUser = {
  id(): Promise<string | null>;
};

type ClaudeRuntime = {
  use(name: 'db'): Promise<ArtifactDb | null>;
  use(name: 'user'): Promise<ArtifactUser | null>;
};

declare global {
  interface Window {
    claude?: ClaudeRuntime;
  }
}

export type ArtifactStorage = {
  readonly db: ArtifactDb;
  readonly userId: string;
};

/**
 * Base de l'artefact et identifiant de l'utilisateur connecté, ou null quand la page
 * ne tourne pas dans un artefact publié (dev local, utilisateur déconnecté, capacité refusée).
 */
export async function connectArtifactStorage(): Promise<ArtifactStorage | null> {
  const claude = window.claude;
  if (claude === undefined) return null;

  const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
  const userId = (await user?.id()) ?? null;
  return db !== null && userId !== null ? { db, userId } : null;
}
