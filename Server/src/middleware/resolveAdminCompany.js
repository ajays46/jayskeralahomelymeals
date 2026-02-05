import prisma from '../config/prisma.js';

/**
 * Resolves the logged-in admin's companyId from User.companyId (via req.user.userId).
 * - Sets req.adminCompanyId = user.companyId (string or null).
 * - When companyId === null, the user is treated as "super admin" and can see all companies' data.
 * - When companyId is set, list/create/update/delete are scoped to that company only.
 * For super admin to "see all", the User row in DB must have company_id = NULL.
 * Must run after authenticateToken (req.user must exist).
 */
export const resolveAdminCompany = async (req, res, next) => {
  try {
    const loggedInUserId = req.user?.userId ?? req.user?.id;
    if (!loggedInUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: loggedInUserId },
      select: { companyId: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // null/undefined/empty string = super admin (see all), non-empty string = company-scoped admin
    const raw = user.companyId ?? null;
    req.adminCompanyId = (typeof raw === 'string' && raw.trim() !== '') ? raw.trim() : null;
    next();
  } catch (err) {
    next(err);
  }
};
