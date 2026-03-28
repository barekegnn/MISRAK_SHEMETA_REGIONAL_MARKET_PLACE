import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

const STEPS = [
  { role: "Admin", href: "/admin", time: "~30s", title: "Live platform stats" },
  { role: "Seller", href: "/merchant", time: "~30s", title: "Dispatch paid orders" },
  { role: "Buyer", href: "/", time: "~30s", title: "AI → cart → Chapa / M-Pesa" },
  { role: "Runner", href: "/runner", time: "~30s", title: "Submit OTP" },
  { role: "Admin", href: "/admin", time: "~30s", title: "Revenue refreshed" },
];

export default function DemoFlowPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">Demo flow</h1>
      <ol className="mt-6 space-y-4">
        {STEPS.map((s, i) => (
          <li key={`${s.title}-${i}`}>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-[#4F46E5]">
                    Step {i + 1} · {s.time}
                  </p>
                  <p className="font-semibold text-neutral-900">{s.title}</p>
                  <p className="text-sm text-neutral-600">{s.role} view</p>
                </div>
                <LinkButton
                  href={s.href}
                  variant="outline"
                  size="sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open {s.role} →
                </LinkButton>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-center text-lg font-semibold text-emerald-700">
        Demo Complete ✅
      </p>
      <LinkButton href="/pitch" className="mt-4 w-full" variant="secondary">
        Investor pitch
      </LinkButton>
    </main>
  );
}
