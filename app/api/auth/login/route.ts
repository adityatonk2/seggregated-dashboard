import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getExpectedToken } from "@/lib/auth";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  const expectedPassword = process.env.PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json(
      { success: false, error: "Login is not configured (PASSWORD env var missing)" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const password = (body as { password?: unknown })?.password;
  if (typeof password !== "string" || password !== expectedPassword) {
    return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 401 });
  }

  const token = await getExpectedToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, token as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });
  return res;
}
