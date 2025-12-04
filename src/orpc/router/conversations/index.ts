import { protectedProcedure } from "@/orpc";
import { db } from "@/db";
import { conversationTable, messageTable } from "@/db/schema";
import { eq, desc, and, ilike } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import {
  listConversationsSchema,
  getConversationSchema,
  createConversationSchema,
  updateConversationSchema,
  deleteConversationSchema,
  addMessageSchema,
  getMessagesSchema,
} from "./schema";

export const conversationsRouter = {
  // List all conversations for the current user
  list: protectedProcedure
    .input(listConversationsSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Build where conditions
      const whereConditions = [eq(conversationTable.userId, userId)];

      if (input.search) {
        whereConditions.push(
          ilike(conversationTable.title, `%${input.search}%`)
        );
      }

      const conversations = await db.query.conversation.findMany({
        where: and(...whereConditions),
        orderBy: [desc(conversationTable.updatedAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          messages: {
            orderBy: [desc(messageTable.createdAt)],
            limit: 1, // Get the last message for preview
          },
        },
      });

      return conversations;
    }),

  // Get a single conversation with all messages
  get: protectedProcedure
    .input(getConversationSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const conversation = await db.query.conversation.findFirst({
        where: and(
          eq(conversationTable.id, input.id),
          eq(conversationTable.userId, userId)
        ),
        with: {
          messages: {
            orderBy: [messageTable.createdAt],
          },
        },
      });

      if (!conversation) {
        throw new ORPCError("NOT_FOUND", { message: "Conversation not found" });
      }

      return conversation;
    }),

  // Create a new conversation
  create: protectedProcedure
    .input(createConversationSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const [conversation] = await db
        .insert(conversationTable)
        .values({
          userId,
          title: input.title,
        })
        .returning();

      return conversation;
    }),

  // Update a conversation
  update: protectedProcedure
    .input(updateConversationSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const [conversation] = await db
        .update(conversationTable)
        .set({
          title: input.title,
        })
        .where(
          and(
            eq(conversationTable.id, input.id),
            eq(conversationTable.userId, userId)
          )
        )
        .returning();

      if (!conversation) {
        throw new ORPCError("NOT_FOUND", { message: "Conversation not found" });
      }

      return conversation;
    }),

  // Delete a conversation
  delete: protectedProcedure
    .input(deleteConversationSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const [deleted] = await db
        .delete(conversationTable)
        .where(
          and(
            eq(conversationTable.id, input.id),
            eq(conversationTable.userId, userId)
          )
        )
        .returning();

      if (!deleted) {
        throw new ORPCError("NOT_FOUND", { message: "Conversation not found" });
      }

      return { success: true };
    }),

  // Add a message to a conversation
  addMessage: protectedProcedure
    .input(addMessageSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify the conversation belongs to the user
      const conversation = await db.query.conversation.findFirst({
        where: and(
          eq(conversationTable.id, input.conversationId),
          eq(conversationTable.userId, userId)
        ),
      });

      if (!conversation) {
        throw new ORPCError("NOT_FOUND", { message: "Conversation not found" });
      }

      const [message] = await db
        .insert(messageTable)
        .values({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          metadata: input.metadata,
        })
        .returning();

      // Update conversation's updatedAt timestamp
      await db
        .update(conversationTable)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(conversationTable.id, input.conversationId));

      return message;
    }),

  // Get messages for a conversation
  getMessages: protectedProcedure
    .input(getMessagesSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify the conversation belongs to the user
      const conversation = await db.query.conversation.findFirst({
        where: and(
          eq(conversationTable.id, input.conversationId),
          eq(conversationTable.userId, userId)
        ),
      });

      if (!conversation) {
        throw new ORPCError("NOT_FOUND", { message: "Conversation not found" });
      }

      const messages = await db.query.message.findMany({
        where: eq(messageTable.conversationId, input.conversationId),
        orderBy: [messageTable.createdAt],
        limit: input.limit,
        offset: input.offset,
      });

      return messages;
    }),
};
