import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  Edit,
  MessageCircle,
  MoreHorizontal,
  PlusIcon,
  Search,
  Trash,
} from "lucide-react";
import { NavUser } from "./nav-user";
import { Link, useParams } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";
import { useInView } from "react-intersection-observer";
import { Conversation } from "@/db/schema/conversation";
import { useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { EditConversationDialog } from "./edit-conversation-dialog";
import { DeleteConversationDialog } from "./delete-conversation-dialog";
import { Spinner } from "./ui/spinner";

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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

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
      <SidebarHeader className="px-2 py-4 space-y-3">
        <div className="flex flex-row items-center justify-between gap-2">
          <Link to="/" className="flex flex-row items-center gap-2 px-2">
            <MessageCircle className="size-4" strokeWidth={2} />
            <div className="text-md font-base text-primary tracking-tight">
              BetterChat
            </div>
          </Link>
        </div>
        <Link to="/">
          <Button
            variant="outline"
            size="sm"
            className="flex w-full items-center gap-2"
          >
            <PlusIcon className="size-4" />
            <span>New Chat</span>
          </Button>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <SidebarGroup key={index}>
              <SidebarGroupLabel>
                <Skeleton className="h-4 w-24" />
              </SidebarGroupLabel>

              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))
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
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        key={conversation.id}
                        asChild
                        isActive={currentConversationId === conversation.id}
                      >
                        <Link to="/c/$id" params={{ id: conversation.id }}>
                          <span>{conversation.title || "Untitled"}</span>
                        </Link>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
            {/* Sentinel element for infinite scroll */}
            {hasNextPage && (
              <div ref={ref} className="flex items-center justify-center p-4">
                {isFetchingNextPage && <Spinner />}
              </div>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      {/* Dialogs */}
      {selectedConversation && (
        <>
          <EditConversationDialog
            conversationId={selectedConversation.id}
            currentTitle={selectedConversation.title || "Untitled"}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteConversationDialog
            conversationId={selectedConversation.id}
            conversationTitle={selectedConversation.title || "Untitled"}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </Sidebar>
  );
};
