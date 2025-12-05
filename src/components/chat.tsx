import { useState, useRef, useEffect } from "react";
import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  Copy,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  Trash,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, generateId } from "ai";
import { LoadingMessage } from "./loading-message";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface ChatProps {
  paramChatId?: string;
}

export const Chat = ({ paramChatId }: ChatProps) => {
  const conversationId = useRef<string>(paramChatId || generateId());
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sendMessage, status, messages, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    id: conversationId.current,
    onFinish: () => {
      if (!paramChatId) {
        queryClient.invalidateQueries({
          queryKey: orpc.conversations.list.key(),
        });
        navigate({ to: "/c/$id", params: { id: conversationId.current } });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error } = useQuery(
    orpc.conversations.get.queryOptions({
      input: {
        id: paramChatId || conversationId.current,
      },
      enabled: !!paramChatId, // Only fetch if we have a paramChatId
    })
  );

  useEffect(() => {
    if (data?.messages.length) {
      setMessages(
        data.messages.map((message) => {
          return {
            id: message.id,
            role: message.role,
            parts: [{ type: "text", text: message.content }],
          };
        })
      );
    }
  }, [data?.messages.length]);

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    setPrompt("");
    sendMessage(
      {
        text: prompt,
      },
      { body: { conversationId: conversationId.current } }
    );
  };

  // Show error state
  if (isError && paramChatId) {
    return (
      <main className="flex h-screen flex-col overflow-hidden">
        <header className="bg-background z-10 flex h-14 w-full shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="text-foreground">Error</div>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium text-destructive">
              Failed to load conversation
            </p>
            <p className="text-sm text-muted-foreground">
              {error?.message ||
                "An error occurred while loading the conversation"}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="bg-background z-10 flex h-14 w-full shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="text-foreground empty:hidden">{data?.title}</div>
      </header>

      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-0 px-5 py-12">
            {messages.map((message, index) => {
              const isAssistant = message.role === "assistant";
              const isLastMessage = index === messages.length - 1;

              return (
                <Message
                  key={message.id}
                  className={cn(
                    "mx-auto flex w-full max-w-3xl flex-col gap-2 px-6",
                    isAssistant ? "items-start" : "items-end"
                  )}
                >
                  {isAssistant ? (
                    <div className="group flex w-full flex-col gap-0">
                      <MessageContent
                        className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0"
                        markdown
                        isAnimating={isLastMessage && status === "streaming"}
                      >
                        {message.parts
                          .map((part) =>
                            part.type === "text" ? part.text : null
                          )
                          .join("")}
                      </MessageContent>
                      <MessageActions
                        className={cn(
                          "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                          isLastMessage && "opacity-100"
                        )}
                      >
                        <MessageAction tooltip="Copy" delayDuration={100}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                          >
                            <Copy />
                          </Button>
                        </MessageAction>
                        <MessageAction tooltip="Upvote" delayDuration={100}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                          >
                            <ThumbsUp />
                          </Button>
                        </MessageAction>
                        <MessageAction tooltip="Downvote" delayDuration={100}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                          >
                            <ThumbsDown />
                          </Button>
                        </MessageAction>
                      </MessageActions>
                    </div>
                  ) : (
                    <div className="group flex flex-col items-end gap-1 w-full">
                      <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%]">
                        {message.parts
                          .map((part) =>
                            part.type === "text" ? part.text : null
                          )
                          .join("")}
                      </MessageContent>

                      <MessageActions
                        className={cn(
                          "flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                        )}
                      >
                        <MessageAction tooltip="Edit" delayDuration={100}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                          >
                            <Pencil />
                          </Button>
                        </MessageAction>
                        <MessageAction tooltip="Delete" delayDuration={100}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                          >
                            <Trash />
                          </Button>
                        </MessageAction>
                        <MessageAction tooltip="Copy" delayDuration={100}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                          >
                            <Copy />
                          </Button>
                        </MessageAction>
                      </MessageActions>
                    </div>
                  )}
                </Message>
              );
            })}

            {status === "submitted" && <LoadingMessage />}
          </ChatContainerContent>
          <div className="absolute bottom-4 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
            <ScrollButton className="shadow-sm" />
          </div>
        </ChatContainerRoot>
      </div>

      <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            isLoading={status !== "ready"}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
          >
            <div className="flex flex-col">
              <PromptInputTextarea
                placeholder="Ask anything"
                className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
                style={{ backgroundColor: "transparent" }}
              />

              <PromptInputActions className="mt-5 flex w-full items-center justify-end gap-2 px-3 pb-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    disabled={!prompt.trim() || status !== "ready"}
                    onClick={handleSubmit}
                    className="size-9 rounded-full"
                  >
                    {status === "ready" ? (
                      <ArrowUp size={18} />
                    ) : (
                      <span className="size-3 rounded-xs bg-primary-foreground" />
                    )}
                  </Button>
                </div>
              </PromptInputActions>
            </div>
          </PromptInput>
        </div>
      </div>
    </main>
  );
};
