import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Google } from "@/components/icons/google";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const RouteComponent = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/",
      },
      {
        onError(context) {
          toast.error(context.error.message);
        },
      }
    );
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="size-4" strokeWidth={2} />
            <div className="text-md font-base text-primary tracking-tight">
              BetterChat
            </div>
          </div>
          <CardTitle className="text-lg">Sign in</CardTitle>
          <CardDescription>Continue to start chatting with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : <Google />}
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export const Route = createFileRoute("/(auth)/login")({
  component: RouteComponent,
});
