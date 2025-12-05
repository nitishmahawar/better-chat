import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  convertToModelMessages,
  generateText,
  UIMessage,
  UserModelMessage,
} from "ai";
import { groq } from "@ai-sdk/groq";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const generateTitle = async (message: UIMessage): Promise<string> => {
  try {
    const { text } = await generateText({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      messages: [
        {
          role: "system",
          content:
            "Generate a concise, descriptive title (maximum 6 words) based on the user's message. Only return the title, nothing else.",
        },
        ...convertToModelMessages([message]),
      ],
      temperature: 0.7,
    });

    const title = text.trim().replace(/^["']|["']$/g, "");

    return title || getTextFromMessage(message);
  } catch (error) {
    console.error("Error generating title:", error);
    return getTextFromMessage(message);
  }
};

export function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("");
}
