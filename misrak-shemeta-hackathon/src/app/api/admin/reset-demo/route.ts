import { resetDemoEnvironment } from "@/app/actions/admin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await resetDemoEnvironment();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
