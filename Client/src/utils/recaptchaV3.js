const RECAPTCHA_SCRIPT_BASE_URL = 'https://www.google.com/recaptcha/api.js?render=';

let recaptchaLoadPromise = null;

export const getRecaptchaV3SiteKey = () => String(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || '').trim();

const waitForRecaptchaReady = (timeoutMs = 8000) =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const checkReady = () => {
      if (window.grecaptcha?.ready && window.grecaptcha?.execute) {
        window.grecaptcha.ready(() => resolve(window.grecaptcha));
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error('reCAPTCHA v3 did not initialize in time'));
        return;
      }
      window.setTimeout(checkReady, 50);
    };
    checkReady();
  });

const loadRecaptchaScript = (siteKey) => {
  if (!siteKey) {
    return Promise.reject(new Error('Missing reCAPTCHA v3 site key'));
  }
  if (window.grecaptcha?.execute) {
    return waitForRecaptchaReady();
  }
  if (recaptchaLoadPromise) {
    return recaptchaLoadPromise;
  }

  recaptchaLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-recaptcha-v3="true"]');
    if (existingScript) {
      waitForRecaptchaReady().then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.src = `${RECAPTCHA_SCRIPT_BASE_URL}${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaV3 = 'true';
    script.onload = () => {
      waitForRecaptchaReady().then(resolve).catch(reject);
    };
    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA v3 script'));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    recaptchaLoadPromise = null;
    throw error;
  });

  return recaptchaLoadPromise;
};

export const executeRecaptchaV3 = async (action) => {
  const siteKey = getRecaptchaV3SiteKey();
  if (!siteKey) return '';
  const grecaptcha = await loadRecaptchaScript(siteKey);
  const token = await grecaptcha.execute(siteKey, { action });
  return String(token || '').trim();
};
