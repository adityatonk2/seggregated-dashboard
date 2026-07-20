import { NextRequest, NextResponse } from "next/server";
import getMongoClientPromise from "@/lib/mongodb";
import { Client } from "@/app/types/client";
import { Filter } from "mongodb"; // ✅ add this

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 500);
    const skip = (page - 1) * limit;

    const sector = searchParams.get("sector");

    // ✅ strongly typed MongoDB filter
    const query: Filter<Client> = {};

    if (sector) {
      query.Designation = { $regex: sector, $options: "i" };
    }

    const client = await getMongoClientPromise();
    const db = client.db("test");
    const collection = db.collection<Client>("clients");

    const data = await collection.find(query).skip(skip).limit(limit).toArray();
    const total = await collection.countDocuments(query);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
