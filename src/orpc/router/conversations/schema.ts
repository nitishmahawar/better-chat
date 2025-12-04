import { z } from "zod";

// Schema for listing conversations
export const listConversationsSchema = z.object({
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
  search: z.string().optional(),
});

// Schema for getting a single conversation
export const getConversationSchema = z.object({
  id: z.string(),
});

// Schema for creating a conversation
export const createConversationSchema = z.object({
  title: z.string().optional(),
});

// Schema for updating a conversation
export const updateConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
});

// Schema for deleting a conversation
export const deleteConversationSchema = z.object({
  id: z.string(),
});

// Schema for adding a message
export const addMessageSchema = z.object({
  conversationId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Schema for getting messages
export const getMessagesSchema = z.object({
  conversationId: z.string(),
  limit: z.number().optional().default(100),
  offset: z.number().optional().default(0),
});
