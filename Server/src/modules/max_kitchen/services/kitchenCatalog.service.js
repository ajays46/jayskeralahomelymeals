/**
 * @feature kitchen-store — Company menus from Prisma (`menus` table) for store operator/manager UIs.
 */
import prisma from '../../../config/prisma.js';

/**
 * @param {string} companyId
 * @returns {Promise<Array<{ id: string, name: string, status: string, createdAt: Date }>>}
 */
export async function listKitchenCatalogMenus(companyId) {
  const cid = String(companyId || '').trim();
  if (!cid) return [];

  const menus = await prisma.menu.findMany({
    where: { companyId: cid },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true
    },
    orderBy: { name: 'asc' }
  });

  return menus;
}
