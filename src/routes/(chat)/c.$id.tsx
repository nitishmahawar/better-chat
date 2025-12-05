import { Chat } from "@/components/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(chat)/c/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <div className="w-full">
      <Chat paramChatId={id} />
    </div>
  );
}
