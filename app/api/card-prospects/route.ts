import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);

    const data = await db.collection("card_prospects").find({}).sort({ sno: 1 }).toArray();

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch card prospects" }, { status: 500 });
  }
}
