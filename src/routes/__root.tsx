import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/lib/auth";
import { getRequestHeaders } from "@tanstack/react-start/server";

interface MyRouterContext {
  queryClient: QueryClient;
}

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const data = await auth.api.getSession({
    headers: getRequestHeaders(),
  });
  return data;
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Better Chat",
      },
      {
        name: "description",
        content:
          "An intelligent AI chatbot powered by modern technology. Have natural conversations with AI.",
      },
      {
        name: "keywords",
        content:
          "AI chatbot, artificial intelligence, chat, conversation, AI assistant",
      },
      // Open Graph
      {
        property: "og:title",
        content: "Better Chat",
      },
      {
        property: "og:description",
        content:
          "An intelligent AI chatbot powered by modern technology. Have natural conversations with AI.",
      },
      {
        property: "og:type",
        content: "website",
      },
      // Twitter Card
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "Better Chat",
      },
      {
        name: "twitter:description",
        content:
          "An intelligent AI chatbot powered by modern technology. Have natural conversations with AI.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const session = await getSession();

    // Check if the current route is an auth route
    const isAuthRoute = location.pathname.startsWith("/login");

    // If not authenticated and not on an auth route, redirect to login
    if (!session && !isAuthRoute) {
      throw redirect({ to: "/login" });
    }

    // If authenticated and on login page, redirect to home
    if (session && isAuthRoute) {
      throw redirect({ to: "/" });
    }

    return { user: session?.user!, session: session?.session! };
  },
  shellComponent: RootDocument,
  notFoundComponent: () => <p>Not Found</p>,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
