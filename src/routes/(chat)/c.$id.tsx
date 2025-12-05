import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(chat)/c/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <div>Hello "/(chat)/$id"!</div>;
}
