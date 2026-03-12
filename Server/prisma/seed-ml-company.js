/**
 * Seed script to create MaXHub Logistics company (name: "ml") if it does not exist.
 * Run from Server directory: node prisma/seed-ml-company.js
 * Requires: DATABASE_URL in .env and migrations applied (including DELIVERY_PARTNER role).
 */
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const ML_COMPANY_NAME = 'ml';

async function getOrCreateSystemUserId() {
  const adminUser = await prisma.user.findFirst({
    where: { userRoles: { some: { name: 'ADMIN' } } },
    select: { id: true },
  });
  if (adminUser) return adminUser.id;

  const firstUser = await prisma.user.findFirst({ select: { id: true } });
  if (firstUser) return firstUser.id;

  throw new Error('No users in system. Create an admin user first (e.g. via JKHM/JLG), then run this seed.');
}

async function seedMlCompany() {
  const existing = await prisma.company.findFirst({
    where: { name: ML_COMPANY_NAME },
  });
  if (existing) {
    console.log(`Company "${ML_COMPANY_NAME}" already exists (id: ${existing.id}).`);
    return;
  }

  const systemUserId = await getOrCreateSystemUserId();
  const address = await prisma.address.create({
    data: {
      userId: systemUserId,
      street: 'MaXHub Logistics',
      housename: 'HQ',
      city: 'Kerala',
      pincode: 680001,
      addressType: 'HOME',
    },
  });
  const company = await prisma.company.create({
    data: { name: ML_COMPANY_NAME, address_id: address.id },
  });
  console.log(`Created company "${ML_COMPANY_NAME}" (id: ${company.id}). Create users with this companyId and roles DELIVERY_PARTNER or CEO/CFO for MaXHub Logistics.`);
}

seedMlCompany()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
