// Allow self-signed certs from Supabase connection pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import app, { ensureAdminUser, ensureTestUser } from '../apps/api/dist/app.mjs';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    await ensureAdminUser().catch(console.error);
    await ensureTestUser().catch(console.error);
    initialized = true;
  }
  app(req, res);
}
