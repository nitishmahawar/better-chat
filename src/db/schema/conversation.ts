import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { userTable } from "./user";
import { messageTable } from "./message";

export const conversationTable = pgTable(
  "conversation",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    title: text("title"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("conversation_userId_idx").on(table.userId),
    index("conversation_updatedAt_idx").on(table.updatedAt),
  ]
);

export const conversationRelations = relations(
  conversationTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [conversationTable.userId],
      references: [userTable.id],
    }),
    messages: many(messageTable),
  })
);
