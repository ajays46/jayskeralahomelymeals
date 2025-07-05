import prisma from '../config/prisma.js';

export const createCompanyService = async ({ name, address_id }) => {
  // Check if a company with the same name exists
  const existing = await prisma.company.findFirst({
    where: { name },
  });
  if (existing) {
    return existing;
  }
  // If not, create a new company
  return await prisma.company.create({
    data: {
      name,
      address_id,
    },
  });
};
