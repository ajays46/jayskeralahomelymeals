import axios from 'axios';
import { verifyTextCaptcha } from './textCaptcha.js';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_V3_SCORE_THRESHOLD = Number(process.env.RECAPTCHA_V3_SCORE_THRESHOLD || 0.5);

export const verifyRecaptchaV2Token = async ({ token, remoteIp } = {}) => {
  const secret = String(process.env.RECAPTCHA_SECRET_KEY || '').trim();
  const captchaToken = String(token || '').trim();

  if (!secret) {
    return { success: false, reason: 'captcha_not_configured' };
  }
  if (!captchaToken) {
    return { success: false, reason: 'missing_captcha_token' };
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', captchaToken);
  if (remoteIp) {
    params.append('remoteip', String(remoteIp));
  }

  try {
    const { data } = await axios.post(RECAPTCHA_VERIFY_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000
    });
    const ok = Boolean(data?.success);
    return {
      success: ok,
      reason: ok ? undefined : 'recaptcha_verification_failed',
      errorCodes: Array.isArray(data?.['error-codes']) ? data['error-codes'] : []
    };
  } catch (error) {
    return { success: false, reason: 'recaptcha_request_failed' };
  }
};

export const verifyRecaptchaV3Token = async ({ token, remoteIp, action, minScore } = {}) => {
  const secret = String(process.env.RECAPTCHA_V3_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY || '').trim();
  const captchaToken = String(token || '').trim();
  const expectedAction = String(action || '').trim();
  const requiredScore = Number.isFinite(minScore) ? minScore : DEFAULT_V3_SCORE_THRESHOLD;

  if (!secret) {
    return { success: false, reason: 'captcha_not_configured' };
  }
  if (!captchaToken) {
    return { success: false, reason: 'missing_captcha_token', requireFallback: true };
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', captchaToken);
  if (remoteIp) {
    params.append('remoteip', String(remoteIp));
  }

  try {
    const { data } = await axios.post(RECAPTCHA_VERIFY_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000
    });
    const ok = Boolean(data?.success);
    const score = Number(data?.score ?? 0);
    const actualAction = String(data?.action || '').trim();
    if (!ok) {
      return {
        success: false,
        reason: 'recaptcha_verification_failed',
        requireFallback: true,
        score,
        action: actualAction,
        errorCodes: Array.isArray(data?.['error-codes']) ? data['error-codes'] : []
      };
    }
    if (expectedAction && actualAction && actualAction !== expectedAction) {
      return {
        success: false,
        reason: 'recaptcha_action_mismatch',
        requireFallback: true,
        score,
        action: actualAction
      };
    }
    if (score < requiredScore) {
      return {
        success: false,
        reason: 'recaptcha_low_score',
        requireFallback: true,
        score,
        action: actualAction
      };
    }
    return { success: true, provider: 'v3', score, action: actualAction };
  } catch (error) {
    return { success: false, reason: 'recaptcha_request_failed', requireFallback: true };
  }
};

/**
 * Supports Google reCAPTCHA token and keeps legacy text-captcha as fallback.
 */
export const verifyCaptchaChallenge = async ({
  captchaToken,
  captchaProvider,
  captchaAction,
  captchaId,
  captchaText,
  purpose = 'register',
  remoteIp
} = {}) => {
  const token = String(captchaToken || '').trim();
  const provider = String(captchaProvider || '').trim().toLowerCase();
  const action = String(captchaAction || purpose || '').trim().toLowerCase();
  if (token) {
    if (provider === 'v3') {
      return verifyRecaptchaV3Token({ token, remoteIp, action });
    }
    return verifyRecaptchaV2Token({ token, remoteIp });
  }
  return verifyTextCaptcha({ captchaId, captchaText, purpose });
};

