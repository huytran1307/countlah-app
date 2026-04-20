import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userSettingsTable = pgTable("user_settings", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.key] })]);

export type UserSetting = typeof userSettingsTable.$inferSelect;
