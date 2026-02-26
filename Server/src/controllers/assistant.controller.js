import AppError from '../utils/AppError.js';
import { assistantChatService } from '../services/assistant.service.js';
import { logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Validate request body for chat: messages array, last message from user, each content <= 2000.
 */
function validateChatBody(body) {
  const { messages, max_tokens, temperature } = body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError('messages array is required and must not be empty', 400, { code: 'VALIDATION_ERROR' });
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') {
    throw new AppError('Last message must be from user', 400, { code: 'VALIDATION_ERROR' });
  }
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m.role !== 'string' || typeof m.content !== 'string') {
      throw new AppError('Each message must have role and content', 400, { code: 'VALIDATION_ERROR' });
    }
    if (m.content.length > MAX_MESSAGE_LENGTH) {
      throw new AppError(`Message content must not exceed ${MAX_MESSAGE_LENGTH} characters`, 400, { code: 'VALIDATION_ERROR' });
    }
  }
  return {
    messages,
    max_tokens: typeof max_tokens === 'number' ? Math.min(2048, Math.max(1, max_tokens)) : 512,
    temperature: typeof temperature === 'number' ? Math.max(0, Math.min(1, temperature)) : 0.7
  };
}

/**
 * POST /api/assistant/chat
 * Body: { messages, max_tokens?, temperature? }
 * Headers: Authorization, X-Company-ID, X-User-ID (or from token)
 */
export const chatController = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.user?.userId;
    if (!userId) {
      return res.status(403).json({
        error: 'User identification required.',
        code: 'USER_REQUIRED'
      });
    }

    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      return res.status(400).json({
        error: 'X-Company-ID header is required.',
        code: 'VALIDATION_ERROR'
      });
    }

    const { messages, max_tokens, temperature } = validateChatBody(req.body);

    const result = await assistantChatService(messages, userId, companyId, { max_tokens, temperature });

    return res.status(200).json({
      message: {
        role: 'assistant',
        content: result.content
      },
      usage: result.usage
    });
  } catch (err) {
    if (err instanceof AppError) {
      const code = err.details?.code || null;
      return res.status(err.statusCode).json({
        error: err.message,
        ...(code && { code })
      });
    }
    logError(LOG_CATEGORIES.SYSTEM, 'Assistant chat controller error', {
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({
      error: 'The assistant is temporarily unavailable. Please try again.',
      code: 'ASSISTANT_ERROR'
    });
  }
};
