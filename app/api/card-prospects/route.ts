import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "scripts", "card-prospects.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContents);

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch card prospects" }, { status: 500 });
  }
}
