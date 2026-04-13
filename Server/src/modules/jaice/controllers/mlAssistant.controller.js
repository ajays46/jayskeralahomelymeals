/**
 * ML Assistant (Jaice) Controller - Proxies to 5004 for CXO/Delivery Manager chat.
 * Allowed roles: DELIVERY_MANAGER, CEO, CFO, ADMIN.
 */
import AppError from '../../../utils/AppError.js';
import { getJaiceGreeting, getJaicePing, postJaiceChat, getJaiceDebugConfig } from '../services/mlAssistant.service.js';

function getAuthHeader(req) {
  const auth = req.headers.authorization;
  return (auth && typeof auth === 'string' && auth.trim()) ? auth.trim() : null;
}

export async function greeting(req, res, next) {
  try {
    const companyId = req.companyId;
    const userId = req.user?.userId ?? req.user?.id;
    if (!companyId || !userId) {
      return res.status(400).json({ error: 'Company and user context required.' });
    }
    const data = await getJaiceGreeting(userId, companyId, getAuthHeader(req));
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function ping(req, res, next) {
  try {
    const companyId = req.companyId;
    const userId = req.user?.userId ?? req.user?.id;
    if (!companyId || !userId) {
      return res.status(400).json({ error: 'Company and user context required.' });
    }
    const data = await getJaicePing(userId, companyId, getAuthHeader(req));
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function chat(req, res, next) {
  try {
    const companyId = req.companyId;
    const userId = req.user?.userId ?? req.user?.id;
    if (!companyId || !userId) {
      return res.status(403).json({ code: 'USER_REQUIRED', error: 'User identification required.' });
    }
    const data = await postJaiceChat(userId, companyId, getAuthHeader(req), req.body);
    res.status(200).json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.details?.code });
    }
    next(err);
  }
}

export async function debugConfig(req, res, next) {
  try {
    const companyId = req.companyId;
    const userId = req.user?.userId ?? req.user?.id;
    if (!companyId || !userId) {
      return res.status(400).json({ error: 'Company and user context required.' });
    }
    const data = await getJaiceDebugConfig(userId, companyId, getAuthHeader(req));
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}
