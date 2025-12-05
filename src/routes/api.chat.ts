import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { db } from "@/db";
import { generateTitle, getTextFromMessage } from "@/lib/utils";
import { Conversation, conversationTable, messageTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const {
            messages,
            conversationId,
          }: { messages: UIMessage[]; conversationId: string } =
            await request.json();

          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return new Response(
              JSON.stringify({
                error: "Unauthorized",
              }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Create a streaming chat response
          let conversation: Conversation | undefined;
          conversation = await db.query.conversation.findFirst({
            where: (conversations, { eq }) =>
              eq(conversations.id, conversationId),
          });

          const lastUserMessage = messages.filter(
            (message) => message.role === "user"
          )[messages.length - 1];

          if (!conversation) {
            const title = await generateTitle(lastUserMessage as any);
            await db.insert(conversationTable).values({
              userId: session.user.id,
              title,
              id: conversationId,
            });
          }

          await db.insert(messageTable).values({
            conversationId: conversationId,
            content: getTextFromMessage(lastUserMessage),
            role: "user",
          });

          const model = groq("meta-llama/llama-4-maverick-17b-128e-instruct");
          const stream = streamText({
            model,
            messages: convertToModelMessages(messages),
            onFinish: async ({ text }) => {
              await db.insert(messageTable).values({
                conversationId: conversationId,
                content: text,
                role: "assistant",
              });
            },
          });

          // Convert stream to HTTP response
          return stream.toUIMessageStreamResponse();
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              error: error.message || "An error occurred",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
