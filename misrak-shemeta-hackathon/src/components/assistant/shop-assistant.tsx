"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queryAssistant } from "@/app/actions/assistant";
import type { AssistantResponse, DeliveryZone } from "@/types";
import { RichResponse } from "@/components/assistant/rich-response";

type Turn = {
  role: "user" | "assistant";
  text: string;
  payload?: AssistantResponse;
};

const MAX = 10;

export function ShopAssistant() {
  const { profile } = useAuth();
  const { t, messages } = useLocale();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const zone: DeliveryZone =
    (profile?.delivery_zone as DeliveryZone) ?? "Haramaya_Campus";

  useEffect(() => {
    if (searchParams.get("openAssistant") === "1") setOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const preset = searchParams.get("preset");
    if (searchParams.get("openAssistant") === "1" && preset === "am") {
      setInput(messages.assistant.suggested.am);
    }
  }, [searchParams, messages.assistant.suggested]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, typing, open]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setTurns((prev) => {
      const next: Turn[] = [...prev, { role: "user", text: q }];
      return next.slice(-MAX);
    });
    setTyping(true);
    try {
      const payload = await queryAssistant(q, zone);
      setTurns((prev) => {
        const next: Turn[] = [
          ...prev,
          { role: "assistant", text: payload.answer, payload },
        ];
        return next.slice(-MAX);
      });
    } finally {
      setTyping(false);
    }
  }, [input, zone]);

  useEffect(() => {
    if (!open || turns.length > 0) return;
    setTurns([
      {
        role: "assistant",
        text: t("assistant.welcome"),
      },
    ]);
  }, [open, turns.length, t]);

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="fixed right-4 z-40 h-14 rounded-2xl px-4 shadow-xl shadow-brand-900/25 md:bottom-8 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] motion-safe:transition-transform motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]"
        onClick={() => setOpen(true)}
        aria-label={t("assistant.title")}
        aria-haspopup="dialog"
      >
        <MessageCircle className="h-6 w-6 shrink-0" />
        <span className="ml-1 hidden max-w-[10rem] truncate sm:inline">
          {t("assistant.title")}
        </span>
        <span className="ml-1.5 hidden shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium opacity-95 md:inline">
          AI
        </span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex h-[90dvh] max-h-[90dvh] flex-col p-0 md:h-full md:max-h-none">
          <SheetHeader className="border-b border-brand-100 bg-brand-50/40 px-4 py-3.5 text-left">
            <SheetTitle className="font-display text-lg text-brand-950">
              {t("assistant.title")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            {turns.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-2xl bg-brand-500 px-4 py-3 text-sm text-white"
                    : "mr-4 rounded-2xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm"
                }
              >
                {m.role === "assistant" && m.payload ? (
                  <RichResponse payload={m.payload} />
                ) : (
                  <span
                    className={
                      m.role === "user" ? "" : "font-ethiopic text-[15px]"
                    }
                  >
                    {m.text}
                  </span>
                )}
              </motion.div>
            ))}
            <AnimatePresence>
              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-1 px-2"
                  aria-hidden
                >
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-2 w-2 rounded-full bg-brand-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: d * 0.12,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
          <div className="space-y-2 border-t border-brand-100 p-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  messages.assistant.suggested.en,
                  messages.assistant.suggested.am,
                  messages.assistant.suggested.om,
                ] as string[]
              ).map((chip) => (
                <Button
                  key={chip}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-auto whitespace-normal py-1.5 text-left text-xs"
                  onClick={() => setInput(chip)}
                >
                  {chip.length > 48 ? `${chip.slice(0, 48)}…` : chip}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("assistant.placeholder")}
                className="min-h-[48px] flex-1 resize-none rounded-xl border-brand-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => void send()}
                disabled={typing}
                aria-label={t("assistant.send")}
              >
                {typing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
