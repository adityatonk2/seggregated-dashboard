import getMongoClientPromise from "@/lib/mongodb";
import { LeadDoc } from "@/app/types/lead";
import { Filter } from "mongodb";

type FacetCount = { _id: string; count: number };

export type GetLeadStatsResult =
  | { total: number; bySource: FacetCount[]; bySector: FacetCount[] }
  | { error: string };

// Mirrors the $facet aggregation in app/api/leads/stats/route.ts, duplicated
// (not imported) to keep this AI tool layer isolated from that route.
export async function getLeadStats(): Promise<GetLeadStatsResult> {
  try {
    const client = await getMongoClientPromise();
    const db = client.db(process.env.MONGODB_NAME);
    const collection = db.collection<LeadDoc>("leads");

    const [result] = await collection
      .aggregate([
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

    return {
      total: result.total[0]?.count || 0,
      bySource: result.bySource,
      bySector: result.bySector,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error fetching lead stats" };
  }
}

const SEARCH_ORGS_HARD_MAX = 20;

export type SearchOrganisationsArgs = { query?: string; sector?: string; limit?: number };

export type SearchOrganisationsResult =
  | { count: number; organisations: { organisation: string; sector: string | null; leadCount: number }[] }
  | { error: string };

// LLM-supplied args need extra tolerance: models sometimes emit the literal
// string "null"/"none" instead of omitting an optional field. Mirrors the
// same helper in lead-tools.ts (kept local rather than shared).
function sanitizeArg(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^(null|undefined|none|n\/a|any|all)$/i.test(trimmed)) return undefined;
  return trimmed;
}

export async function searchOrganisations(args: SearchOrganisationsArgs): Promise<SearchOrganisationsResult> {
  try {
    const limit = Math.min(Math.max(args.limit ?? 10, 1), SEARCH_ORGS_HARD_MAX);

    const query = sanitizeArg(args.query);
    const sector = sanitizeArg(args.sector);

    const match: Record<string, unknown> = {};
    if (query) match.organisation = new RegExp(query, "i");
    if (sector) match.sector = new RegExp(`^${sector}$`, "i");

    const client = await getMongoClientPromise();
    const db = client.db(process.env.MONGODB_NAME);
    const collection = db.collection<LeadDoc>("leads");

    const pipeline = [
      { $match: match as Filter<LeadDoc> },
      {
        $group: {
          _id: "$organisation",
          sector: { $first: "$sector" },
          leadCount: { $sum: 1 },
        },
      },
      { $sort: { leadCount: -1 } },
      { $limit: limit },
    ];

    const [grouped, countResult] = await Promise.all([
      collection.aggregate(pipeline).toArray(),
      collection.aggregate([{ $match: match as Filter<LeadDoc> }, { $group: { _id: "$organisation" } }, { $count: "count" }]).toArray(),
    ]);

    return {
      count: countResult[0]?.count || 0,
      organisations: grouped.map((g) => ({
        organisation: g._id as string,
        sector: (g.sector as string) ?? null,
        leadCount: g.leadCount as number,
      })),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error searching organisations" };
  }
}
