import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(chat)")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
