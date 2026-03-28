import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

const ROLES = [
  { href: "/admin", emoji: "🛡️", label: "Admin", desc: "Platform stats & reset" },
  { href: "/merchant", emoji: "🏪", label: "Seller", desc: "Shop dashboard" },
  { href: "/runner", emoji: "🚴", label: "Runner", desc: "OTP deliveries" },
  { href: "/", emoji: "🛍️", label: "Buyer", desc: "Home + AI assistant" },
] as const;

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-center text-3xl font-bold text-[#1E1B4B]">
        4-actor demo
      </h1>
      <p className="mt-2 text-center text-neutral-600">
        Use seeded demo accounts when Supabase is configured. Each role opens its primary surface.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {ROLES.map((r) => (
          <Card key={r.href} className="border-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>{r.emoji}</span> {r.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-neutral-600">{r.desc}</p>
              <LinkButton href={r.href} className="w-full bg-[#4F46E5]">
                Open {r.label} →
              </LinkButton>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-8 border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">Flow</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-700">
          <p>Admin → Seller → Buyer (AI & cart) → Runner (OTP) → Admin</p>
          <Link href="/demo/flow" className="mt-2 inline-block text-sm text-[#4F46E5] underline-offset-4 hover:underline">
            Guided timeline
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
