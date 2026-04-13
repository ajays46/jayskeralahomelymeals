import prisma from '../../../../config/prisma.js';

export const findAuthByEmail = (email) =>
  prisma.auth.findUnique({ where: { email } });

export const findAuthById = (id) =>
  prisma.auth.findUnique({ where: { id } });

export const findAuthByPhone = (phoneNumber) =>
  prisma.auth.findFirst({ where: { phoneNumber } });

export const findAuthByPhoneInCompany = (phoneNumber, companyId) =>
  prisma.auth.findFirst({
    where: { phoneNumber, user: { companyId } }
  });
