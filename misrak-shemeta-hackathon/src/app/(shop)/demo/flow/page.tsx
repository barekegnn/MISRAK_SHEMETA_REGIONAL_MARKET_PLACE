"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

const STEPS = [
  { role: "admin", href: "/admin", tab: "Tab 1" },
  { role: "seller", href: "/seller", tab: "Tab 2" },
  { role: "buyer", href: "/demo", tab: "Tab 3" },
  { role: "runner", href: "/runner", tab: "Tab 4" },
  { role: "admin", href: "/admin", tab: "Tab 1" },
] as const;

export default function DemoFlowPage() {
  const { t, messages } = useLocale();
  const steps = messages.demoFlow.steps;
  const [done, setDone] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-10 py-4">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("demoFlow.title")}</h1>
        <p className="text-sm text-brand-600">{t("demoFlow.stepMinutes")}</p>
      </div>

      <ol className="relative space-y-6 border-s-2 border-brand-200 pl-8">
        {steps.map((s, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[1.15rem] flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {i + 1}
            </span>
            <Card className="p-5">
              <h2 className="font-semibold text-brand-950">{s.title}</h2>
              <p className="mt-1 text-sm text-brand-700">{s.body}</p>
              <Button asChild variant="secondary" className="mt-4 rounded-xl">
                <Link href={STEPS[i]?.href ?? "/demo"} target="_blank" rel="noopener noreferrer">
                  Switch to this role → ({STEPS[i]?.tab})
                </Link>
              </Button>
              <p className="mt-2 text-xs text-brand-500">~30s</p>
            </Card>
          </li>
        ))}
      </ol>

      {!done ? (
        <Button className="w-full rounded-2xl" size="lg" onClick={() => setDone(true)}>
          Mark demo complete
        </Button>
      ) : (
        <Card className="flex flex-col items-center gap-3 border-accent-300 bg-accent-500/10 p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-accent-600" />
          <h2 className="font-display text-2xl font-bold">{t("demoFlow.complete")}</h2>
          <p className="text-brand-800">{t("demoFlow.completeSummary")}</p>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/pitch">Open pitch</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
