import prisma from '../config/prisma.js';

/**
 * Resolve company by URL path. Uses existing Company.name only (no schema change).
 * Matches path to name case-insensitively and ignores spaces
 * (e.g. path "jkkfds" matches name "jkk fds").
 */
export const normalizeCompanyPathKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

export const getCompanyByPath = async (path) => {
  if (!path || typeof path !== 'string' || !path.trim()) {
    return null;
  }
  const normalizedPath = normalizeCompanyPathKey(path);
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });
  const company = companies.find((c) => normalizeCompanyPathKey(c.name) === normalizedPath);
  return company || null;
};
