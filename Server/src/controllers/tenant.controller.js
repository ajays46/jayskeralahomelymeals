import { getCompanyByPath } from '../services/tenant.service.js';
import AppError from '../utils/AppError.js';

/**
 * GET /api/company-by-path/:path
 * Public. Resolves company from URL path (e.g. jkhm, jlg) using Company.name (case-insensitive).
 * Returns { id, name } for tenant context. No schema change required.
 */
export const companyByPath = async (req, res, next) => {
  try {
    const { path } = req.params;
    const company = await getCompanyByPath(path);
    if (!company) {
      throw new AppError('Company not found', 404);
    }
    res.status(200).json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (error) {
    next(error);
  }
};
