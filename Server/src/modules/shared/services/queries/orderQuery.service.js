import prisma from '../../../../config/prisma.js';

export const findOrderById = (id, include) =>
  prisma.order.findUnique({ where: { id }, ...(include && { include }) });

export const findOrdersByUser = (userId, options = {}) =>
  prisma.order.findMany({
    where: { userId },
    ...(options.include && { include: options.include }),
    orderBy: { createdAt: 'desc' },
    ...(options.take && { take: options.take })
  });

export const findOrdersByCompany = (companyId, filters = {}) => {
  const where = {};
  if (companyId) where.user = { companyId };
  if (filters.status) where.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }
  return prisma.order.findMany({
    where,
    include: filters.include || { user: true, deliveryItems: true, payments: true },
    orderBy: { createdAt: 'desc' },
    ...(filters.take && { take: filters.take }),
    ...(filters.skip && { skip: filters.skip })
  });
};
