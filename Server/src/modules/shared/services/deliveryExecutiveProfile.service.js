import prisma from '../../../config/prisma.js';

export async function createDeliveryExecutiveProfile(tx, userId) {
  const joinedDateStr = new Date().toISOString().slice(0, 10);
  await (tx || prisma).$executeRaw`
    INSERT INTO delivery_executive_profile (user_id, joined_date, status)
    VALUES (${userId}, ${joinedDateStr}, 'ACTIVE')
  `;
}
