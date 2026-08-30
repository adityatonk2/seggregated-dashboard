import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ success: false, error: "File must be a .xlsx spreadsheet" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    tmpPath = path.join(os.tmpdir(), `leads-import-${randomUUID()}.xlsx`);
    await writeFile(tmpPath, buffer);

    const scriptPath = path.join(process.cwd(), "scripts", "import_excel.py");

    const { stdout, stderr } = await execFileAsync("python3", [scriptPath, tmpPath], {
      cwd: process.cwd(),
      timeout: TIMEOUT_MS,
    });

    const lastLine = stdout.trim().split("\n").filter(Boolean).pop() || "";

    let result: unknown;
    try {
      result = JSON.parse(lastLine);
    } catch {
      return NextResponse.json(
        { success: false, error: "Import script returned unparseable output", detail: stdout || stderr },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    // The python script may exit non-zero but still have printed a structured
    // {success:false, error:...} JSON line (e.g. bad header row) — surface that
    // directly instead of a generic failure.
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    const stdout: string = execError?.stdout || "";
    const lastLine = stdout.trim().split("\n").filter(Boolean).pop();
    if (lastLine) {
      try {
        const parsed = JSON.parse(lastLine);
        if (parsed && typeof parsed === "object") {
          return NextResponse.json(parsed, { status: 400 });
        }
      } catch {
        // fall through to generic error below
      }
    }

    const detail = execError?.stderr || stdout || execError?.message || "Unknown error";
    return NextResponse.json({ success: false, error: "Import failed", detail: String(detail) }, { status: 500 });
  } finally {
    if (tmpPath) {
      await unlink(tmpPath).catch(() => {});
    }
  }
}
