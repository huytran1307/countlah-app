import Anthropic from "@anthropic-ai/sdk";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SETTING_KEY = "anthropic_api_key";
export const DEFAULT_MODEL = "claude-opus-4-7";

/**
 * Returns an Anthropic client + model name.
 * Priority:
 *   1. User-provided key stored in DB
 *   2. ANTHROPIC_API_KEY environment variable
 * Throws if neither is available.
 */
export async function getClaudeClient(): Promise<{ client: Anthropic; model: string }> {
  try {
    const [setting] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, SETTING_KEY));

    if (setting?.value) {
      return {
        client: new Anthropic({ apiKey: setting.value }),
        model: DEFAULT_MODEL,
      };
    }
  } catch {
    // fall through
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
      model: DEFAULT_MODEL,
    };
  }

  throw new Error(
    "No Anthropic API key configured. Please add your API key in Settings."
  );
}

export async function getStoredKeyStatus(): Promise<{
  isSet: boolean;
  hint: string | null;
}> {
  try {
    const [setting] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, SETTING_KEY));

    if (setting?.value) {
      const k = setting.value;
      const hint = k.length > 8 ? `${k.slice(0, 10)}...${k.slice(-4)}` : "sk-ant-****";
      return { isSet: true, hint };
    }
  } catch {
    // ignore
  }
  return { isSet: false, hint: null };
}

export async function storeApiKey(apiKey: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key: SETTING_KEY, value: apiKey })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value: apiKey, updatedAt: new Date() },
    });
}

export async function deleteApiKey(): Promise<void> {
  await db.delete(settingsTable).where(eq(settingsTable.key, SETTING_KEY));
}
