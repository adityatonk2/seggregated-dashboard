import { NextRequest, NextResponse } from "next/server";
import getMongoClientPromise from "@/lib/mongodb";
import { LeadDoc } from "@/app/types/lead";
import { Filter, Sort } from "mongodb";

const SORTABLE_FIELDS = new Set(["name", "organisation", "role", "sector", "connectedOn", "createdAt"]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";
    const source = searchParams.get("source")?.trim() || "";
    const sector = searchParams.get("sector")?.trim() || "";
    const organisation = searchParams.get("organisation")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";

    const sortField = searchParams.get("sort") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? 1 : -1;

    const query: Record<string, unknown> = {};

    if (source) {
      const sources = source.split(",").map((s) => s.trim()).filter(Boolean);
      query.source = sources.length > 1 ? { $in: sources } : sources[0];
    }

    if (sector) {
      query.sector = new RegExp(`^${sector}$`, "i");
    }

    if (organisation) {
      query.organisation = new RegExp(organisation, "i");
    }

    if (role) {
      query.role = new RegExp(role, "i");
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { organisation: regex }, { role: regex }, { sector: regex }];
    }

    const filter = query as Filter<LeadDoc>;

    const client = await getMongoClientPromise();
    const db = client.db(process.env.MONGODB_NAME);
    const collection = db.collection<LeadDoc>("leads");

    const sort: Sort = { [SORTABLE_FIELDS.has(sortField) ? sortField : "createdAt"]: sortOrder };

    const rawData = await collection.find(filter).sort(sort).skip(skip).limit(limit).toArray();

    const data = rawData.map((doc) => ({
      ...doc,
      _id: doc._id?.toString(),
      connectedOn: doc.connectedOn ? new Date(doc.connectedOn).toISOString() : null,
      createdAt: new Date(doc.createdAt).toISOString(),
      updatedAt: new Date(doc.updatedAt).toISOString(),
    }));

    const total = await collection.countDocuments(filter);

    return NextResponse.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
