import app, { ensureAdminUser } from "../apps/api/src/app";

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await ensureAdminUser().catch(console.error);
    initialized = true;
  }
  (app as any)(req, res);
}
