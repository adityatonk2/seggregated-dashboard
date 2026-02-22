const fs = require("fs");
const path = require("path");
const { getDb } = require("./mongo");

async function seed() {
  const db = await getDb();

  const filePath = path.join(process.cwd(), "scripts", "card-prospects.json");

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error("card-prospects.json must be an array");
  }

  await db.collection("card_prospects").deleteMany({});
  await db.collection("card_prospects").insertMany(
    data.map((item) => ({
      sno: item.sno,
      name: item.name?.trim(),
      designation: item.designation?.trim(),
      organisation: item.organisation?.trim(),
      linkedin: item.linkedin || null,
      source: "card",
      createdAt: new Date(),
    })),
  );

  console.log("✅ card_prospects seeded successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
