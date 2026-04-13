import prisma from '../../../../config/prisma.js';

export const findUserById = (id, select) =>
  prisma.user.findUnique({ where: { id }, ...(select && { select }) });

export const findUserByIdWithRoles = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: { userRoles: true, auth: true, company: true }
  });

export const findUsersByCompany = (companyId, include) =>
  prisma.user.findMany({
    where: { companyId },
    ...(include && { include }),
    orderBy: { createdAt: 'desc' }
  });

export const findUsersByRole = (roleName, companyId = null) => {
  const where = {};
  if (companyId) where.companyId = companyId;
  return prisma.user.findMany({
    where,
    include: { auth: true, userRoles: true, company: true, contacts: { take: 1 } },
    orderBy: { createdAt: 'desc' }
  }).then(users =>
    users.filter(u => u.auth?.email && (u.userRoles || []).some(r => r.name === roleName))
  );
};

export const findUsersByIds = (ids, select) =>
  prisma.user.findMany({ where: { id: { in: ids } }, ...(select && { select }) });
