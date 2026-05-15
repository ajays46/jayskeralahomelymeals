import axios from 'axios';
import { verifyTextCaptcha } from './textCaptcha.js';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export const verifyRecaptchaToken = async ({ token, remoteIp } = {}) => {
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

/**
 * Supports Google reCAPTCHA token and keeps legacy text-captcha as fallback.
 */
export const verifyCaptchaChallenge = async ({
  captchaToken,
  captchaId,
  captchaText,
  purpose = 'register',
  remoteIp
} = {}) => {
  const token = String(captchaToken || '').trim();
  if (token) {
    return verifyRecaptchaToken({ token, remoteIp });
  }
  return verifyTextCaptcha({ captchaId, captchaText, purpose });
};

