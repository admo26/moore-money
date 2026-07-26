import { NextResponse } from "next/server";
import { getAuthorizedUser } from "@/lib/auth";
import { runSync } from "@/lib/akahu/sync";

/** Manual "Sync now" trigger, for a signed-in + allowlisted user. */
export async function POST() {
  const user = await getAuthorizedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSync();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Manual sync failed", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
