import prisma from '../config/prisma.js';

/**
 * Resolve company by URL path. Uses existing Company.name only (no schema change).
 * Matches path to name case-insensitively (e.g. path "jkhm" matches name "JKHM").
 */
export const getCompanyByPath = async (path) => {
  if (!path || typeof path !== 'string' || !path.trim()) {
    return null;
  }
  const normalizedPath = path.trim().toLowerCase();
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });
  const company = companies.find((c) => c.name.toLowerCase() === normalizedPath);
  return company || null;
};
