import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const REGIONS = [
  { region: "UAE", starter: 49, growth: 149, pro: 349, agency: 999, currency: "AED" },
  { region: "INDIA", starter: 499, growth: 1499, pro: 3499, agency: 9999, currency: "INR" },
  { region: "INTERNATIONAL", starter: 15, growth: 45, pro: 99, agency: 299, currency: "USD" },
  { region: "SAUDI", starter: 59, growth: 179, pro: 419, agency: 1199, currency: "SAR" },
  { region: "KUWAIT", starter: 5, growth: 15, pro: 35, agency: 99, currency: "KWD" },
];

async function main() {
  for (const r of REGIONS) {
    await prisma.regionPricing.upsert({
      where: { region: r.region },
      create: r,
      update: r,
    });
  }
  console.log(`[seed] RegionPricing upserted: ${REGIONS.length} regions`);

  // Super admin
  const passwordHash = await bcrypt.hash("DdotsAdmin2026!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ddotshop.com" },
    create: {
      email: "admin@ddotshop.com",
      name: "DdotsShop Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
    update: { role: "SUPER_ADMIN" },
  });
  await prisma.tenant.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, name: "DdotsShop Admin", plan: "AGENCY" },
    update: { plan: "AGENCY" },
  });
  console.log(`[seed] super admin ready: admin@ddotshop.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
