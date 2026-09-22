import { Bot, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  streaming?: boolean;
  children?: ReactNode;
}

export default function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 px-4 py-5", isUser ? "bg-transparent" : "bg-slate-900/40")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-slate-700" : "bg-cyan-900/80 text-cyan-300",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1 text-xs font-medium text-slate-500">
          {isUser ? "You" : "IEEE XML Agent"}
        </p>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {message.content}
          {message.streaming && (
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-cyan-400 align-middle" />
          )}
        </div>
        {message.children}
      </div>
    </div>
  );
}
