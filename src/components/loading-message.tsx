import { memo } from "react";
import { Message } from "./ui/message";
import { TextShimmer } from "./ui/text-shimmer";

export const LoadingMessage = memo(() => (
  <Message className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-6 items-start">
    <TextShimmer>Thinking...</TextShimmer>
  </Message>
));
