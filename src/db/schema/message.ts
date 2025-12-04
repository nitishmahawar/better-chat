import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { conversationTable } from "./conversation";

export const messageTable = pgTable(
  "message",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationTable.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_conversationId_idx").on(table.conversationId),
    index("message_createdAt_idx").on(table.createdAt),
  ]
);

export const messageRelations = relations(messageTable, ({ one }) => ({
  conversation: one(conversationTable, {
    fields: [messageTable.conversationId],
    references: [conversationTable.id],
  }),
}));
