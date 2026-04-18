/** @product max_kitchen — Guide §9.5 `/kitchen/menus|plans|reconciliation`; same handlers as kitchen-store v2. */
import express from 'express';
import { authenticateToken } from '../../../../middleware/authHandler.js';
import { checkRole } from '../../../../middleware/checkRole.js';
import { resolveCompanyId } from '../../../../middleware/resolveCompanyId.js';
import {
  generatePlan,
  listPlans,
  getPlan,
  getPlanDemandVsStoreStock,
  getDeliveryMealCounts,
  getKitchenHolding,
  patchKitchenPlanLine,
  approvePlan,
  issuePlan,
  submitPlan,
  rejectPlan,
  getNextDayReadiness,
  postPhysicalVsSystem,
  createReconciliationSession,
  listReconciliationSessions,
  getReconciliationSession,
  patchReconciliationSession,
  putReconciliationSessionLines,
  finalizeReconciliationSession,
  patchReconciliationSessionLineManagerReview,
  getWeeklyScheduleByKind,
  getWeeklySlotByKind,
  putWeeklySlotByKind,
  listMenuCombosByKind,
  getWeeklySchedule,
  getWeeklySlot,
  putWeeklySlot,
  listMenuCombos,
  createMealProgram,
  listMealPrograms,
  listMealProgramMenuItemMappings,
  postMealProgramMenuItemMapping,
  deleteMealProgramMenuItemMapping,
  getMealProgramRecipeLines,
  upsertMealProgramRecipeLine,
  deleteMealProgramRecipeLine
} from '../../controllers/kitchenStore.controller.js';

const router = express.Router();
const smSo = checkRole('STORE_MANAGER', 'STORE_OPERATOR');
const smOnly = checkRole('STORE_MANAGER');

router.use(authenticateToken);
router.use(resolveCompanyId);

router.get('/menus/by-kind/:menu_kind/weekly-schedule', smSo, getWeeklyScheduleByKind);
router.get('/menus/by-kind/:menu_kind/weekly-slot', smSo, getWeeklySlotByKind);
router.put('/menus/by-kind/:menu_kind/weekly-slot', smSo, putWeeklySlotByKind);
router.get('/menus/by-kind/:menu_kind/menu-items', smSo, listMenuCombosByKind);

router.get('/menus/:menu_id/weekly-schedule', smSo, getWeeklySchedule);
router.get('/menus/:menu_id/weekly-slot', smSo, getWeeklySlot);
router.put('/menus/:menu_id/weekly-slot', smSo, putWeeklySlot);
router.get('/menus/:menu_id/menu-items', smSo, listMenuCombos);

/**
 * Meal programs: create program = manager-only; list + BOM + dish mappings = operator + manager.
 */
router.post('/meal-programs', smOnly, createMealProgram);
router.get('/meal-programs', smSo, listMealPrograms);
router.get('/meal-programs/menu-item-mappings', smSo, listMealProgramMenuItemMappings);
router.post('/meal-programs/menu-item-mappings', smSo, postMealProgramMenuItemMapping);
router.delete('/meal-programs/menu-item-mappings/:mapping_id', smSo, deleteMealProgramMenuItemMapping);
router.get('/meal-programs/:program_id/recipe-lines', smSo, getMealProgramRecipeLines);
router.post('/meal-programs/:program_id/recipe-lines', smSo, upsertMealProgramRecipeLine);
router.delete('/meal-programs/:program_id/recipe-lines/:line_id', smSo, deleteMealProgramRecipeLine);

router.get('/orders/delivery-meal-counts', smSo, getDeliveryMealCounts);
router.get('/kitchen-holding', smSo, getKitchenHolding);

router.post('/plans/generate', smSo, generatePlan);
router.get('/plans', smSo, listPlans);
router.get('/plans/:plan_id/demand-vs-store-stock', smSo, getPlanDemandVsStoreStock);
router.patch('/plans/:plan_id/lines/:line_id', smSo, patchKitchenPlanLine);
router.post('/plans/:plan_id/submit', checkRole('STORE_OPERATOR'), submitPlan);
router.post('/plans/:plan_id/reject', checkRole('STORE_MANAGER'), rejectPlan);
router.get('/plans/:plan_id', smSo, getPlan);
router.post('/plans/:plan_id/approve', checkRole('STORE_MANAGER'), approvePlan);
router.post('/plans/:plan_id/issue', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), issuePlan);

router.get('/reconciliation/next-day-readiness', smSo, getNextDayReadiness);
router.post('/reconciliation/physical-vs-system', smSo, postPhysicalVsSystem);

router.get('/reconciliation/sessions', smSo, listReconciliationSessions);
router.post('/reconciliation/sessions', smSo, createReconciliationSession);
router.get('/reconciliation/sessions/:session_id', smSo, getReconciliationSession);
router.patch('/reconciliation/sessions/:session_id', smSo, patchReconciliationSession);
router.put('/reconciliation/sessions/:session_id/lines', smSo, putReconciliationSessionLines);
router.post('/reconciliation/sessions/:session_id/finalize', smSo, finalizeReconciliationSession);
router.patch('/reconciliation/sessions/:session_id/lines/:line_id/manager-review', smOnly, patchReconciliationSessionLineManagerReview);

export default router;
