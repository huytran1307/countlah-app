import app, { ensureAdminUser } from '../apps/api/dist/app.mjs';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    await ensureAdminUser().catch(console.error);
    initialized = true;
  }
  app(req, res);
}
