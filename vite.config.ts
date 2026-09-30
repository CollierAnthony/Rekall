import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Chemins relatifs : la page est publiée comme artefact, pas servie à la racine d'un domaine.
  base: './',
});
