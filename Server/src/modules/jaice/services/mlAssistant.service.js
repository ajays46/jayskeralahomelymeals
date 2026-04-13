/**
 * ML Assistant (Jaice) Service - Proxies to Delivery Partner 5004 API.
 * GET /api/assistant/greeting, GET /api/assistant/chat/ping, POST /api/assistant/chat, GET /api/assistant/debug/config.
 * Ref: JAICE_FRONTEND_GUIDE_5004.md
 */
import axios from 'axios';
import AppError from '../../../utils/AppError.js';
import { logError, LOG_CATEGORIES } from '../../../utils/criticalLogger.js';

const JAICE_API_BASE = (process.env.AI_ROUTE_API_FOURTH || 'http://localhost:5004').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 60 * 1000;

const jaiceClient = axios.create({
  baseURL: JAICE_API_BASE,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Proxy request to 5004 with auth headers. Throws AppError on non-2xx.
 */
async function proxyTo5004(method, path, userId, companyId, authHeader, body = null) {
  const headers = {
    'X-Company-ID': companyId,
    'X-User-ID': userId,
  };
  if (authHeader) headers['Authorization'] = authHeader;

  const config = { method, url: path, headers };
  if (body && (method === 'POST' || method === 'PUT')) config.data = body;

  try {
    const response = await jaiceClient.request(config);
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    const msg = data?.error || err.message || 'Jaice request failed';
    const code = data?.code || (status === 403 ? 'ROLE_FORBIDDEN' : status === 503 ? 'NO_LLM_CONFIG' : 'ASSISTANT_ERROR');
    logError(LOG_CATEGORIES.SYSTEM, 'Jaice proxy error', { path, status, error: msg, companyId });
    throw new AppError(msg, status >= 400 ? status : 500, { code });
  }
}

/**
 * GET /api/assistant/greeting
 */
export async function getJaiceGreeting(userId, companyId, authHeader) {
  return proxyTo5004('GET', '/api/assistant/greeting', userId, companyId, authHeader);
}

/**
 * GET /api/assistant/chat/ping
 */
export async function getJaicePing(userId, companyId, authHeader) {
  return proxyTo5004('GET', '/api/assistant/chat/ping', userId, companyId, authHeader);
}

/**
 * POST /api/assistant/chat
 * Body: { messages, max_tokens?, temperature? }
 */
export async function postJaiceChat(userId, companyId, authHeader, body) {
  const { messages, max_tokens = 512, temperature = 0.3 } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError('messages array is required and must not be empty', 400, { code: 'VALIDATION_ERROR' });
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') {
    throw new AppError('Last message must be from user', 400, { code: 'VALIDATION_ERROR' });
  }
  const trimmed = messages.slice(-20);
  return proxyTo5004('POST', '/api/assistant/chat', userId, companyId, authHeader, {
    messages: trimmed,
    max_tokens: Math.min(2048, Math.max(1, Number(max_tokens) || 512)),
    temperature: Math.max(0, Math.min(1, Number(temperature) ?? 0.3)),
  });
}

/**
 * GET /api/assistant/debug/config
 */
export async function getJaiceDebugConfig(userId, companyId, authHeader) {
  return proxyTo5004('GET', '/api/assistant/debug/config', userId, companyId, authHeader);
}
