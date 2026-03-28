"use client";

import { useCallback, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth/context";
import { queryAssistant } from "@/app/actions/assistant";
import { RichResponse } from "@/components/assistant/RichResponse";
import type { AssistantResponse } from "@/types";

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; payload: AssistantResponse };

const MAX_MSG = 10;

export function ShopAssistant() {
  const { deliveryZone, profileLanguage } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  const welcome =
    profileLanguage === "am"
      ? "👋 ሰላም! ምን ልርዳህ?"
      : profileLanguage === "om"
        ? "👋 Akkam! Ma isaan isin gargaaruu danda'u?"
        : "👋 Hi! Ask me about products and shops.";

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      text: q,
    };
    setMsgs((m) => [...m, userMsg].slice(-MAX_MSG));
    setLoading(true);
    try {
      const payload = await queryAssistant(q, deliveryZone);
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        payload,
      };
      setMsgs((m) => [...m, assistantMsg].slice(-MAX_MSG));
    } finally {
      setLoading(false);
    }
  }, [input, loading, deliveryZone]);

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[#4F46E5] p-0 shadow-lg hover:bg-[#4338CA] md:bottom-6"
        onClick={() => setOpen(true)}
        aria-label="Open shop assistant"
      >
        <MessageCircle className="size-6" />
      </Button>
      <span className="pointer-events-none fixed bottom-[5.25rem] right-4 z-40 hidden rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-900 shadow md:block">
        Powered by AI 🤖
      </span>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b border-neutral-100 p-4">
            <SheetTitle className="flex items-center justify-between gap-2">
              <span>🤖 Misrak AI</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {msgs.length === 0 ? (
                <p className="text-sm text-neutral-600">{welcome}</p>
              ) : null}
              {msgs.map((m) =>
                m.role === "user" ? (
                  <div
                    key={m.id}
                    className="ml-8 rounded-lg bg-indigo-50 p-3 text-sm text-neutral-900"
                  >
                    {m.text}
                  </div>
                ) : (
                  <RichResponse key={m.id} data={m.payload} />
                ),
              )}
              {loading ? (
                <div className="flex gap-1 px-2">
                  <span
                    className="inline-block size-2 animate-bounce rounded-full bg-neutral-400"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="inline-block size-2 animate-bounce rounded-full bg-neutral-400"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="inline-block size-2 animate-bounce rounded-full bg-neutral-400"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              ) : null}
            </div>
          </ScrollArea>
          <div className="space-y-2 border-t border-neutral-100 p-4">
            <div className="flex flex-wrap gap-2">
              {[
                "ምን ዓይነት መጻሕፍት አለ?",
                "Cheapest laptop?",
                "Meeshaalee barnoota meeqa?",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setInput(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products…"
                className="min-h-[72px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <Button
                type="button"
                className="shrink-0 self-end bg-[#4F46E5]"
                onClick={() => void send()}
                disabled={loading}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
