import { NextRequest, NextResponse } from "next/server";
import getMongoClientPromise from "@/lib/mongodb";
import { LeadDoc } from "@/app/types/lead";
import { Filter } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const source = searchParams.get("source")?.trim() || "";
    const sector = searchParams.get("sector")?.trim() || "";
    const organisation = searchParams.get("organisation")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (source) {
      const sources = source.split(",").map((s) => s.trim()).filter(Boolean);
      query.source = sources.length > 1 ? { $in: sources } : sources[0];
    }
    if (sector) query.sector = new RegExp(`^${sector}$`, "i");
    if (organisation) query.organisation = new RegExp(organisation, "i");
    if (role) query.role = new RegExp(role, "i");
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { organisation: regex }, { role: regex }, { sector: regex }];
    }

    const filter = query as Filter<LeadDoc>;

    const client = await getMongoClientPromise();
    const db = client.db(process.env.MONGODB_NAME);
    const collection = db.collection<LeadDoc>("leads");

    const [result] = await collection
      .aggregate([
        { $match: filter },
        {
          $facet: {
            total: [{ $count: "count" }],
            bySource: [{ $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
            bySector: [
              { $match: { sector: { $ne: null } } },
              { $group: { _id: "$sector", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      total: result.total[0]?.count || 0,
      bySource: result.bySource,
      bySector: result.bySector,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
