import prisma from '../../../../config/prisma.js';

export const findMenuItemById = (id, include) =>
  prisma.menuItem.findUnique({ where: { id }, ...(include && { include }) });

export const findMenuItemsByMenu = (menuId, include) =>
  prisma.menuItem.findMany({
    where: { menuId },
    ...(include && { include }),
    orderBy: { createdAt: 'desc' }
  });
