import axios from 'axios';
import AppError from '../utils/AppError.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Assistant Service - Proxies chat to the route optimization assistant API (e.g. port 5003 / flask3).
 * Same API as curl: POST /api/assistant/chat with Bearer token, X-Company-ID, X-User-ID.
 */

const MAX_HISTORY = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
const LLM_TIMEOUT_MS = 30 * 1000;

const ASSISTANT_API_BASE = process.env.AI_ROUTE_API_THIRD || 'http://localhost:5003';
const ASSISTANT_AUTH_TOKEN = process.env.EXTERNAL_API_AUTH_TOKEN || 'mysecretkey123';

/** In-memory rate limit: companyId -> { count, resetAt } */
const rateLimitMap = new Map();

function checkRateLimit(companyId) {
  const now = Date.now();
  let entry = rateLimitMap.get(companyId);
  if (!entry) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(companyId, entry);
  }
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    logInfo(LOG_CATEGORIES.SYSTEM, 'Assistant rate limit exceeded', { companyId });
    throw new AppError('Too many requests. Please try again in a minute.', 429, { code: 'RATE_LIMIT_EXCEEDED' });
  }
}

/**
 * Call the external route optimization assistant API (same as curl to port 5003).
 * @param {Array<{role: string, content: string}>} messages - trimmed to last MAX_HISTORY
 * @param {string} userId
 * @param {string} companyId
 * @param {object} options - { max_tokens, temperature }
 * @returns {Promise<{ content: string, usage: { prompt_tokens, completion_tokens, total_tokens } }>}
 */
async function callAssistantApi(messages, userId, companyId, options = {}) {
  const max_tokens = Math.min(Number(options.max_tokens) || 512, 2048);
  const temperature = Math.max(0, Math.min(1, Number(options.temperature) ?? 0.7));

  const url = `${ASSISTANT_API_BASE.replace(/\/$/, '')}/api/assistant/chat`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ASSISTANT_AUTH_TOKEN}`,
    'X-Company-ID': companyId,
    'X-User-ID': userId
  };
  const body = {
    messages,
    max_tokens,
    temperature
  };

  const response = await axios.post(url, body, {
    headers,
    timeout: LLM_TIMEOUT_MS,
    validateStatus: () => true
  });

  if (response.status !== 200) {
    const errMsg = response.data?.error || response.statusText || 'Assistant request failed';
    if (response.status === 429) {
      throw new AppError('Too many requests. Please try again in a minute.', 429, { code: 'RATE_LIMIT_EXCEEDED' });
    }
    if (response.status === 504) {
      throw new AppError('The assistant is taking too long. Please try again.', 504, { code: 'ASSISTANT_TIMEOUT' });
    }
    throw new AppError(errMsg, response.status >= 500 ? 500 : response.status, { code: 'ASSISTANT_ERROR' });
  }

  const data = response.data;
  const content = data?.message?.content ?? '';
  const usage = data?.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  return { content, usage };
}

/**
 * Run with timeout; on timeout throw 504 ASSISTANT_TIMEOUT.
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new AppError('The assistant is taking too long. Please try again.', 504, { code: 'ASSISTANT_TIMEOUT' })), ms)
    )
  ]);
}

/**
 * Chat entry: rate limit, trim history, proxy to external assistant API.
 */
export const assistantChatService = async (messages, userId, companyId, options = {}) => {
  checkRateLimit(companyId);

  const trimmed = Array.isArray(messages) ? messages.slice(-MAX_HISTORY) : [];

  try {
    const result = await withTimeout(
      callAssistantApi(trimmed, userId, companyId, options),
      LLM_TIMEOUT_MS
    );
    logInfo(LOG_CATEGORIES.SYSTEM, 'Assistant chat completed', { companyId, userId });
    return result;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      throw new AppError('The assistant is taking too long. Please try again.', 504, { code: 'ASSISTANT_TIMEOUT' });
    }
    logError(LOG_CATEGORIES.SYSTEM, 'Assistant chat failed', { companyId, userId, error: err.message });
    throw new AppError('The assistant is temporarily unavailable. Please try again.', 500, { code: 'ASSISTANT_ERROR' });
  }
};
