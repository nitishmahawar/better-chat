// Auth schema exports
export * from "./user";
export * from "./session";
export * from "./account";
export * from "./verification";

// Chat schema exports
export * from "./conversation";
export * from "./message";

// Mapped schema for better-auth
import { userTable, userRelations } from "./user";
import { sessionTable, sessionRelations } from "./session";
import { accountTable, accountRelations } from "./account";
import { verificationTable } from "./verification";
import { conversationTable, conversationRelations } from "./conversation";
import { messageTable, messageRelations } from "./message";

export const authSchema = {
  user: userTable,
  session: sessionTable,
  account: accountTable,
  verification: verificationTable,
};

export const schema = {
  ...authSchema,
  conversation: conversationTable,
  message: messageTable,
  // Relations
  userRelations,
  sessionRelations,
  accountRelations,
  conversationRelations,
  messageRelations,
};
