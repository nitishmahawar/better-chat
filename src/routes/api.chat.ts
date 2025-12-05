import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { messages, conversationId } = await request.json();

        try {
          // Create a streaming chat response
          const model = openai("gpt-4.1-mini");
          const stream = streamText({
            model,
            messages: convertToModelMessages(messages),
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
