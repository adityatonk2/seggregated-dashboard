/**
 * One-time (but safely re-runnable) migration that unifies the `clients`,
 * `companies`, and `card_prospects` collections into a single `leads`
 * collection. Run with:
 *
 *   npx ts-node scripts/migrateToLeads.ts
 *
 * The dedupeKey normalization below MUST stay identical to the one in
 * scripts/import_excel.py so both writers upsert into the same rows.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI not found in env");
const dbName = process.env.MONGODB_NAME;
if (!dbName) throw new Error("MONGODB_NAME not found in env");

type LeadSource = "client_export" | "card" | "company_directory" | "excel_import";

interface LeadRow {
  name: string;
  organisation: string;
  role: string | null;
  linkedin: string | null;
  email: string | null;
  sector: string | null;
  connectedOn: Date | null;
  source: LeadSource;
  dedupeKey: string;
}

function normalizeLinkedin(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .split("?")[0];
}

function makeDedupeKey(name: string, organisation: string, linkedin: string | null): string {
  if (linkedin && linkedin.trim()) return normalizeLinkedin(linkedin);
  return `${name.trim().toLowerCase()}|${organisation.trim().toLowerCase()}`;
}

function buildRow(
  name: string | null | undefined,
  organisation: string | null | undefined,
  role: string | null | undefined,
  linkedin: string | null | undefined,
  email: string | null | undefined,
  sector: string | null | undefined,
  connectedOn: Date | null,
  source: LeadSource,
): LeadRow | null {
  const cleanName = name?.trim();
  const cleanOrg = organisation?.trim();
  if (!cleanName || !cleanOrg) return null;

  const cleanLinkedin = linkedin?.trim() || null;
  return {
    name: cleanName,
    organisation: cleanOrg,
    role: role?.trim() || null,
    linkedin: cleanLinkedin,
    email: email?.trim() || null,
    sector: sector?.trim().toLowerCase() || null,
    connectedOn,
    source,
    dedupeKey: makeDedupeKey(cleanName, cleanOrg, cleanLinkedin),
  };
}

async function migrate() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  const rows: LeadRow[] = [];
  const counts = {
    client_export: { read: 0, mapped: 0 },
    card: { read: 0, mapped: 0 },
    company_directory: { read: 0, mapped: 0, skippedExecs: 0 },
  };

  // 1. clients
  const clients = await db.collection("clients").find({}).toArray();
  counts.client_export.read = clients.length;
  for (const c of clients) {
    const row = buildRow(
      c.Name,
      c.Organization,
      c.Designation,
      c.LinkedIn,
      c["Email Address"],
      null,
      c["Connected On"] ? new Date(c["Connected On"]) : null,
      "client_export",
    );
    if (row) {
      rows.push(row);
      counts.client_export.mapped++;
    }
  }

  // 2. companies -> up to 4 exec leads each
  const companies = await db.collection("companies").find({}).toArray();
  counts.company_directory.read = companies.length;
  const execRoles: Array<{ nameField: string; linkedinField: string; role: string }> = [
    { nameField: "ceoName", linkedinField: "ceoLinkedin", role: "CEO" },
    { nameField: "cioName", linkedinField: "cioLinkedin", role: "CIO" },
    { nameField: "cfoName", linkedinField: "cfoLinkedin", role: "CFO" },
    { nameField: "ctoCdoName", linkedinField: "ctoCdoLinkedin", role: "CTO/CDO" },
  ];
  for (const co of companies) {
    for (const exec of execRoles) {
      const row = buildRow(
        co[exec.nameField],
        co.company,
        exec.role,
        co[exec.linkedinField],
        null,
        co.sector,
        null,
        "company_directory",
      );
      if (row) {
        rows.push(row);
        counts.company_directory.mapped++;
      } else {
        counts.company_directory.skippedExecs++;
      }
    }
  }

  // 3. card_prospects (Mongo collection if populated, else the JSON file)
  type CardRow = { name?: string; organisation?: string; designation?: string; linkedin?: string };
  let cardRaw: CardRow[] = await db.collection("card_prospects").find({}).toArray() as unknown as CardRow[];
  if (cardRaw.length === 0) {
    const filePath = path.join(process.cwd(), "scripts", "card-prospects.json");
    cardRaw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  counts.card.read = cardRaw.length;
  for (const cp of cardRaw) {
    const row = buildRow(cp.name, cp.organisation, cp.designation, cp.linkedin, null, null, null, "card");
    if (row) {
      rows.push(row);
      counts.card.mapped++;
    }
  }

  // Upsert everything, keyed on dedupeKey, so re-running is a no-op.
  const leads = db.collection("leads");
  let inserted = 0;
  let updated = 0;
  const now = new Date();

  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const ops = batch.map((row) => ({
      updateOne: {
        filter: { dedupeKey: row.dedupeKey },
        update: {
          $set: { ...row, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }));
    const result = await leads.bulkWrite(ops);
    inserted += result.upsertedCount;
    updated += result.modifiedCount;
  }

  await leads.createIndex({ dedupeKey: 1 }, { unique: true });
  await leads.createIndex({ source: 1 });
  await leads.createIndex({ sector: 1 });
  await leads.createIndex({ organisation: 1 });

  const total = await leads.countDocuments();

  console.log("--- Migration summary ---");
  console.log("clients read:", counts.client_export.read, "-> mapped:", counts.client_export.mapped);
  console.log(
    "companies read:",
    counts.company_directory.read,
    "-> exec leads mapped:",
    counts.company_directory.mapped,
    "skipped (blank exec):",
    counts.company_directory.skippedExecs,
  );
  console.log("card prospects read:", counts.card.read, "-> mapped:", counts.card.mapped);
  console.log("rows processed:", rows.length, "| inserted:", inserted, "| updated:", updated);
  console.log("leads collection total:", total);

  await client.close();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
