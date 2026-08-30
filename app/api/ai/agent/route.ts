import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runIcpAnalyst } from "@/lib/agent/icp-analyst";

const requestSchema = z.object({
  prompt: z.string().trim().min(1, "prompt must not be empty").max(2000, "prompt is too long"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const result = await runIcpAnalyst(parsed.data.prompt);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("ICP Analyst agent failed:", error);
    const message = error instanceof Error ? error.message : "Agent failed to complete the request";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
