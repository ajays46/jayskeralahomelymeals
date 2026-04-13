/** @product max_route · @feature partner-manager — executives, partners, vehicles assign/unassign */
import express from 'express';
import { authenticateToken } from '../../../../middleware/authHandler.js';
import { checkRole } from '../../../../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../../../../middleware/resolveCompanyId.js';
import {
  getExecutives,
  getPartners,
  getVehicles,
  postAssignVehicle,
  postUnassignVehicle,
  postCreatePartner,
} from '../../controllers/mlPartnerManager.controller.js';

const router = express.Router();

router.get(
  '/executives',
  authenticateToken,
  checkRole('PARTNER_MANAGER'),
  resolveCompanyId,
  requireCompanyId,
  getExecutives
);

router.get(
  '/partners',
  authenticateToken,
  checkRole('PARTNER_MANAGER'),
  resolveCompanyId,
  requireCompanyId,
  getPartners
);

router.post(
  '/partners',
  authenticateToken,
  checkRole('PARTNER_MANAGER'),
  resolveCompanyId,
  requireCompanyId,
  postCreatePartner
);

router.get(
  '/vehicles',
  authenticateToken,
  checkRole('PARTNER_MANAGER'),
  resolveCompanyId,
  requireCompanyId,
  getVehicles
);

router.post(
  '/vehicles/assign',
  authenticateToken,
  checkRole('PARTNER_MANAGER'),
  resolveCompanyId,
  requireCompanyId,
  postAssignVehicle
);

router.post(
  '/vehicles/unassign',
  authenticateToken,
  checkRole('PARTNER_MANAGER'),
  resolveCompanyId,
  requireCompanyId,
  postUnassignVehicle
);

export default router;
