import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : la page est publiée comme artefact, pas servie à la racine d'un domaine.
  base: './',
});
