import getMongoClientPromise from "@/lib/mongodb";
import { Lead, LeadDoc, LeadSource } from "@/app/types/lead";
import { Filter, ObjectId } from "mongodb";

// LLM-supplied args need extra tolerance beyond a normal API caller: models
// (especially smaller local ones via Ollama) sometimes emit the literal
// string "null"/"none"/"n/a" instead of omitting an optional field, and
// comma-separate multiple values into a single string (e.g. "CTO,CIO") that
// must become a regex alternation, not a literal substring match.
function sanitizeArg(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^(null|undefined|none|n\/a|any|all)$/i.test(trimmed)) return undefined;
  return trimmed;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitTerms(value: string): string[] {
  return value
    .split(/[,|]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(escapeRegExp);
}

// Substring alternation — appropriate for organisation names, where a
// partial match (e.g. "Health" inside "Memorial Hermann Health System") is
// desirable.
function toAlternationRegex(value: string): RegExp {
  return new RegExp(splitTerms(value).join("|"), "i");
}

// Word-boundary alternation — required for role/title acronyms. Without
// boundaries, "CTO" as a bare substring also matches "Director" (di-recto-r),
// "Doctor", etc. Short-acronym false positives make substring matching
// unusable for role search specifically.
function toWordBoundaryRegex(value: string): RegExp {
  const parts = splitTerms(value).map((p) => `\\b${p}\\b`);
  return new RegExp(parts.join("|"), "i");
}

// Anchored exact-match alternation — sectors are a fixed category set, so
// this mirrors the `^sector$` exact-match convention already used in
// app/api/leads/route.ts, extended to support multiple sectors at once.
function toExactAlternationRegex(value: string): RegExp {
  const parts = splitTerms(value);
  return new RegExp(`^(${parts.join("|")})$`, "i");
}

// Mirrors the filter-building pattern in app/api/leads/route.ts, duplicated
// (not imported) so this AI tool layer can never affect that route's
// behavior. Kept private to this file.
function buildLeadFilter(args: {
  organisation?: string;
  role?: string;
  sector?: string;
  source?: LeadSource | LeadSource[];
}): Filter<LeadDoc> {
  const query: Record<string, unknown> = {};

  if (args.source) {
    const sources = (Array.isArray(args.source) ? args.source : [args.source])
      .map((s) => sanitizeArg(s))
      .filter((s): s is LeadSource => Boolean(s));
    if (sources.length > 1) query.source = { $in: sources };
    else if (sources.length === 1) query.source = sources[0];
  }

  const sector = sanitizeArg(args.sector);
  const organisation = sanitizeArg(args.organisation);
  const role = sanitizeArg(args.role);

  if (sector) query.sector = toExactAlternationRegex(sector);
  if (organisation) query.organisation = toAlternationRegex(organisation);
  if (role) query.role = toWordBoundaryRegex(role);

  return query as Filter<LeadDoc>;
}

function toLead(doc: LeadDoc): Lead {
  return {
    ...doc,
    _id: doc._id?.toString() || "",
    connectedOn: doc.connectedOn ? new Date(doc.connectedOn).toISOString() : null,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

const SEARCH_LEADS_HARD_MAX = 25;

export type SearchLeadsArgs = {
  organisation?: string;
  role?: string;
  sector?: string;
  source?: LeadSource | LeadSource[];
  limit?: number;
};

export type SearchLeadsResult = { count: number; leads: Lead[] } | { error: string };

export async function searchLeads(args: SearchLeadsArgs): Promise<SearchLeadsResult> {
  try {
    const filter = buildLeadFilter(args);
    const limit = Math.min(Math.max(args.limit ?? 10, 1), SEARCH_LEADS_HARD_MAX);

    const client = await getMongoClientPromise();
    const db = client.db(process.env.MONGODB_NAME);
    const collection = db.collection<LeadDoc>("leads");

    const [docs, count] = await Promise.all([
      collection.find(filter).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return { count, leads: docs.map(toLead) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error searching leads" };
  }
}

const SIMILAR_LEADS_HARD_MAX = 20;

export type FindSimilarLeadsArgs = { leadId: string; limit?: number };

export type FindSimilarLeadsResult = { sourceLead: Lead | null; similar: Lead[] } | { error: string };

export async function findSimilarLeads(args: FindSimilarLeadsArgs): Promise<FindSimilarLeadsResult> {
  if (!ObjectId.isValid(args.leadId)) {
    return { error: `"${args.leadId}" is not a valid lead id` };
  }

  try {
    const limit = Math.min(Math.max(args.limit ?? 10, 1), SIMILAR_LEADS_HARD_MAX);

    const client = await getMongoClientPromise();
    const db = client.db(process.env.MONGODB_NAME);
    const collection = db.collection<LeadDoc>("leads");

    const sourceDoc = await collection.findOne({ _id: new ObjectId(args.leadId) });
    if (!sourceDoc) {
      return { sourceLead: null, similar: [] };
    }

    const orConditions: Record<string, unknown>[] = [{ organisation: sourceDoc.organisation }];
    if (sourceDoc.sector) orConditions.push({ sector: sourceDoc.sector });
    if (sourceDoc.role) {
      const keywords = sourceDoc.role
        .split(/\s+/)
        .filter((word) => word.length > 2)
        .map(escapeRegExp);
      if (keywords.length) {
        orConditions.push({ role: new RegExp(keywords.map((k) => `\\b${k}\\b`).join("|"), "i") });
      }
    }

    const filter = {
      _id: { $ne: sourceDoc._id },
      $or: orConditions,
    } as Filter<LeadDoc>;

    const similarDocs = await collection.find(filter).limit(limit).toArray();

    return { sourceLead: toLead(sourceDoc), similar: similarDocs.map(toLead) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error finding similar leads" };
  }
}
