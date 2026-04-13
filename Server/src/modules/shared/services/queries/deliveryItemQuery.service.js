import prisma from '../../../../config/prisma.js';

export const findDeliveryItemById = (id, include) =>
  prisma.deliveryItem.findUnique({ where: { id }, ...(include && { include }) });

export const findDeliveryItemsByOrder = (orderId, include) =>
  prisma.deliveryItem.findMany({
    where: { orderId },
    ...(include && { include }),
    orderBy: { createdAt: 'desc' }
  });

export const findDeliveryItemsByDate = (date, options = {}) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const where = { deliveryDate: { gte: startOfDay, lte: endOfDay } };
  if (options.companyId) where.order = { user: { companyId: options.companyId } };
  if (options.status) where.status = options.status;
  if (options.session) where.deliveryTimeSlot = options.session;

  return prisma.deliveryItem.findMany({
    where,
    ...(options.include && { include: options.include }),
    orderBy: { createdAt: 'desc' }
  });
};
