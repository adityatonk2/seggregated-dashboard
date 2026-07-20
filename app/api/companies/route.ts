import { NextRequest, NextResponse } from "next/server";
import getMongoClientPromise from "@/lib/mongodb";
import { Client } from "@/app/types/client";
import { Filter } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 500);
    const skip = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const sector = searchParams.get("sector") || "";

    const query: Filter<Client> = {};

    if (sector) {
      query.sector = sector;
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { company: regex },
        { sector: regex },
        { ceoName: regex },
        { cioName: regex },
        { cfoName: regex },
        { ctoCdoName: regex },
      ];
    }

    const client = await getMongoClientPromise();
    const db = client.db("test");
    const collection = db.collection<Client>("companies");

    const rawData = await collection.find(query).skip(skip).limit(limit).sort({ company: 1 }).toArray();

    // 🔑 Convert `_id` to string for frontend compatibility
    const data = rawData.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }));

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
