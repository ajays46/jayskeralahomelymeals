/**
 * Seed script to create JPK and JOM companies if they do not exist.
 * Run from Server directory: node prisma/seed-jpk-jom-companies.js
 * Requires: DATABASE_URL in .env and migrations applied.
 */
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const COMPANIES = [
  { name: 'JPK', street: "Jay's Popular Kitchen", city: 'Kerala' },
  { name: 'JOM', street: "Jay's Office Meals", city: 'Kerala' },
];

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

async function seedCompany({ name, street, city }) {
  const existing = await prisma.company.findFirst({
    where: { name },
  });
  if (existing) {
    console.log(`Company "${name}" already exists (id: ${existing.id}).`);
    return;
  }

  const systemUserId = await getOrCreateSystemUserId();
  const address = await prisma.address.create({
    data: {
      userId: systemUserId,
      street,
      housename: 'HQ',
      city,
      pincode: 680001,
      addressType: 'HOME',
    },
  });
  const company = await prisma.company.create({
    data: { name, address_id: address.id },
  });
  console.log(`Created company "${name}" (id: ${company.id}). Access at /${name.toLowerCase()}`);
}

async function seedJpkJomCompanies() {
  for (const company of COMPANIES) {
    await seedCompany(company);
  }
}

seedJpkJomCompanies()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
