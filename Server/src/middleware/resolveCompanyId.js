import prisma from '../config/prisma.js';

/**
 * Resolves company_id for multi-tenant API requests.
 * Priority: X-Company-ID header > company_id query > company_id in body.
 * If none provided and req.user exists (after authenticateToken), loads User.companyId from DB.
 * Sets req.companyId (string or null). Does not block when missing; use requireCompanyId for that.
 * Must run after authenticateToken when using fallback from user.
 */
export const resolveCompanyId = async (req, res, next) => {
  try {
    const fromHeader = req.headers['x-company-id'];
    const fromQuery = req.query?.company_id;
    const fromBody = req.body?.company_id;

    let companyId = (fromHeader || fromQuery || fromBody)?.trim() || null;

    if (!companyId && req.user) {
      const userId = req.user.userId ?? req.user.id;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { companyId: true }
        });
        if (user?.companyId) {
          companyId = typeof user.companyId === 'string' ? user.companyId.trim() : String(user.companyId);
        }
      }
    }

    req.companyId = companyId || null;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Use after resolveCompanyId. Returns 400 if req.companyId is missing.
 */
export const requireCompanyId = (req, res, next) => {
  if (!req.companyId || typeof req.companyId !== 'string' || req.companyId.trim() === '') {
    return res.status(400).json({
      error: 'company_id is required. Provide X-Company-ID header, company_id query parameter, or company_id in request body'
    });
  }
  next();
};
