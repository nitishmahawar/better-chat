// Auth schema exports
export * from "./user";
export * from "./session";
export * from "./account";
export * from "./verification";

// Chat schema exports
export * from "./conversation";
export * from "./message";

// Mapped schema for better-auth
import { userTable } from "./user";
import { sessionTable } from "./session";
import { accountTable } from "./account";
import { verificationTable } from "./verification";
import { conversationTable } from "./conversation";
import { messageTable } from "./message";

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
};
