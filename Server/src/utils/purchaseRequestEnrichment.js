import prisma from '../config/prisma.js';

const displayNameFromContact = (c) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || '';

/**
 * Load Contact rows for given user ids; optional scope to users in `companyId`.
 * Returns Map<userId, displayName> (first contact per user when multiple exist).
 */
async function contactDisplayNameByUserId(userIds, companyId) {
  const unique = [...new Set(userIds.map((id) => String(id).trim()).filter(Boolean))];
  if (unique.length === 0) return new Map();

  const contacts = await prisma.contact.findMany({
    where: {
      userId: { in: unique },
      ...(companyId
        ? {
            user: { companyId }
          }
        : {})
    },
    select: { userId: true, firstName: true, lastName: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  const map = new Map();
  for (const c of contacts) {
    const name = displayNameFromContact(c);
    if (!name) continue;
    if (!map.has(c.userId)) map.set(c.userId, name);
  }
  return map;
}

function enrichItem(item, nameByUserId) {
  if (!item || typeof item !== 'object') return item;
  const uid = item.requested_by ?? item.requested_by_user_id;
  if (!uid) return item;
  const name = nameByUserId.get(String(uid));
  if (!name) return item;
  return { ...item, operator_name: name };
}

/**
 * Attach `operator_name` from `contacts` (first_name + last_name) for each row's `requested_by`.
 */
export async function enrichPurchaseRequestListPayload(data, companyId) {
  if (!data) return data;

  if (Array.isArray(data)) {
    const ids = data.map((row) => row?.requested_by ?? row?.requested_by_user_id).filter(Boolean);
    const nameByUserId = await contactDisplayNameByUserId(ids, companyId);
    return data.map((row) => enrichItem(row, nameByUserId));
  }

  if (typeof data === 'object') {
    const keys = ['items', 'requests', 'results'];
    for (const key of keys) {
      const arr = data[key];
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const ids = arr.map((row) => row?.requested_by ?? row?.requested_by_user_id).filter(Boolean);
      const nameByUserId = await contactDisplayNameByUserId(ids, companyId);
      return { ...data, [key]: arr.map((row) => enrichItem(row, nameByUserId)) };
    }
  }

  return data;
}

export async function enrichSinglePurchaseRequestPayload(data, companyId) {
  if (!data || typeof data !== 'object') return data;
  const uid = data.requested_by ?? data.requested_by_user_id;
  if (!uid) return data;
  const nameByUserId = await contactDisplayNameByUserId([uid], companyId);
  return enrichItem(data, nameByUserId);
}
