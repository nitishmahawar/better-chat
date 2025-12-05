import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { MessageCircle, PlusIcon, Search } from "lucide-react";
import { NavUser } from "./nav-user";
import { Link, useParams } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";
import { useInView } from "react-intersection-observer";
import { Conversation } from "@/db/schema/conversation";
import { useEffect, useMemo } from "react";

// Helper function to group conversations by time period
const groupConversationsByPeriod = (conversations: Conversation[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const last3Months = new Date(today);
  last3Months.setMonth(last3Months.getMonth() - 3);
  const last6Months = new Date(today);
  last6Months.setMonth(last6Months.getMonth() - 6);

  const groups: {
    period: string;
    conversations: Conversation[];
  }[] = [
    { period: "Today", conversations: [] },
    { period: "Yesterday", conversations: [] },
    { period: "Last 7 days", conversations: [] },
    { period: "Last month", conversations: [] },
    { period: "Last 3 months", conversations: [] },
    { period: "Last 6 months", conversations: [] },
    { period: "Older", conversations: [] },
  ];

  conversations.forEach((conversation) => {
    const updatedAt = new Date(conversation.updatedAt);

    if (updatedAt >= today) {
      groups[0].conversations.push(conversation);
    } else if (updatedAt >= yesterday) {
      groups[1].conversations.push(conversation);
    } else if (updatedAt >= lastWeek) {
      groups[2].conversations.push(conversation);
    } else if (updatedAt >= lastMonth) {
      groups[3].conversations.push(conversation);
    } else if (updatedAt >= last3Months) {
      groups[4].conversations.push(conversation);
    } else if (updatedAt >= last6Months) {
      groups[5].conversations.push(conversation);
    } else {
      groups[6].conversations.push(conversation);
    }
  });

  // Filter out empty groups
  return groups.filter((group) => group.conversations.length > 0);
};

export const ChatSidebar = () => {
  const { id } = useParams({ strict: false });
  const currentConversationId = id;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(
      orpc.conversations.list.infiniteOptions({
        input: (pageParam) => ({ cursor: pageParam, limit: 20 }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
          if (lastPage.nextCursor) {
            return lastPage.nextCursor;
          }
          return undefined;
        },
      })
    );

  console.log(data);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  // Fetch next page when the sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all conversations from all pages
  const allConversations = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.conversations);
  }, [data]);

  // Group conversations by time period
  const groupedConversations = useMemo(
    () => groupConversationsByPeriod(allConversations),
    [allConversations]
  );

  return (
    <Sidebar>
      <SidebarHeader className="px-2 py-4 space-y-2.5">
        <div className="flex flex-row items-center justify-between gap-2">
          <Link to="/" className="flex flex-row items-center gap-2 px-2">
            <MessageCircle className="size-4" strokeWidth={2} />
            <div className="text-md font-base text-primary tracking-tight">
              BetterChat
            </div>
          </Link>
          <Button variant="ghost" className="size-8">
            <Search className="size-4" />
          </Button>
        </div>
        <Link to="/">
          <Button variant="outline" className="flex w-full items-center gap-2">
            <PlusIcon className="size-4" />
            <span>New Chat</span>
          </Button>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : groupedConversations.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">
              No conversations yet
            </p>
          </div>
        ) : (
          <>
            {groupedConversations.map((group) => (
              <SidebarGroup key={group.period}>
                <SidebarGroupLabel>{group.period}</SidebarGroupLabel>
                <SidebarMenu>
                  {group.conversations.map((conversation) => (
                    <SidebarMenuButton
                      key={conversation.id}
                      asChild
                      isActive={currentConversationId === conversation.id}
                    >
                      <Link to="/c/$id" params={{ id: conversation.id }}>
                        <span>{conversation.title || "Untitled"}</span>
                      </Link>
                    </SidebarMenuButton>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
            {/* Sentinel element for infinite scroll */}
            {hasNextPage && (
              <div ref={ref} className="flex items-center justify-center p-4">
                {isFetchingNextPage && (
                  <p className="text-sm text-muted-foreground">
                    Loading more...
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};
