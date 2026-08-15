import { NextResponse } from "next/server";
import { getAuthorizedUser } from "@/lib/auth";
import { reapplyRules, recategorizeTransfers } from "@/lib/categorization";

/** "Re-run all rules" trigger (Rules page): reapplies rules, then re-scans for internal-transfer pairs. */
export async function POST() {
  const user = await getAuthorizedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ruleMatched = await reapplyRules();
    const transferMatched = await recategorizeTransfers();
    return NextResponse.json({
      success: true,
      matched: ruleMatched + transferMatched,
      ruleMatched,
      transferMatched,
    });
  } catch (err) {
    console.error("Recategorize failed", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
