import { defineConfig } from 'astro/config';

const GH_USER = 'nicolasloi';
const GH_REPO = 'CDM-prono';

export default defineConfig({
  site: `https://${GH_USER}.github.io`,
  base: `/${GH_REPO}`,
  trailingSlash: 'ignore',
});
