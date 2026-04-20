import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { invoicesTable } from "./invoices";

export const invoiceLogsTable = pgTable("invoice_logs", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoicesTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  status: text("status").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvoiceLogSchema = createInsertSchema(invoiceLogsTable).omit({ id: true, createdAt: true });
export type InsertInvoiceLog = z.infer<typeof insertInvoiceLogSchema>;
export type InvoiceLog = typeof invoiceLogsTable.$inferSelect;
