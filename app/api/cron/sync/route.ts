import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/lib/akahu/sync";

/**
 * Daily Akahu sync, triggered by Vercel Cron (see vercel.json). Akahu
 * personal apps have no webhooks and only refresh daily, so a cron pull is
 * the sync model for this app.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSync();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Cron sync failed", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
