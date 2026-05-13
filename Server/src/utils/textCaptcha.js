import crypto from 'crypto';
import svgCaptcha from 'svg-captcha';

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const captchaStore = new Map();

const normalizePurpose = (purpose) => String(purpose || 'register').trim().toLowerCase();

const purgeExpiredCaptchas = () => {
  const now = Date.now();
  for (const [key, value] of captchaStore.entries()) {
    if (!value?.expiresAt || value.expiresAt <= now) {
      captchaStore.delete(key);
    }
  }
};

export const createTextCaptcha = (purpose = 'register') => {
  purgeExpiredCaptchas();

  const normalizedPurpose = normalizePurpose(purpose);
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 4,
    color: true,
    background: '#f3f4f6',
    ignoreChars: '0oO1iIl',
    width: 180,
    height: 60
  });

  const captchaId = crypto.randomUUID();
  captchaStore.set(captchaId, {
    text: String(captcha.text || '').trim(),
    purpose: normalizedPurpose,
    expiresAt: Date.now() + CAPTCHA_TTL_MS
  });

  const imageBase64 = Buffer.from(captcha.data).toString('base64');
  return {
    captchaId,
    imageData: `data:image/svg+xml;base64,${imageBase64}`,
    expiresInMs: CAPTCHA_TTL_MS
  };
};

export const verifyTextCaptcha = ({ captchaId, captchaText, purpose = 'register' }) => {
  purgeExpiredCaptchas();

  const normalizedPurpose = normalizePurpose(purpose);
  const id = String(captchaId || '').trim();
  const answer = String(captchaText || '').trim();

  if (!id || !answer) {
    return { success: false, reason: 'missing_captcha' };
  }

  const saved = captchaStore.get(id);
  captchaStore.delete(id); // one-time use

  if (!saved) {
    return { success: false, reason: 'captcha_expired' };
  }
  if (saved.purpose !== normalizedPurpose) {
    return { success: false, reason: 'captcha_purpose_mismatch' };
  }
  if (saved.text !== answer) {
    return { success: false, reason: 'captcha_mismatch' };
  }

  return { success: true };
};
