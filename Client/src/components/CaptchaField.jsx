import { useEffect, useMemo, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const CaptchaField = ({ accent, onChange, error, disabled = false, recaptchaKey = 0, action = 'register' }) => {
  const onChangeRef = useRef(onChange);
  const captchaRef = useRef(null);
  const siteKey = useMemo(() => String(import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim(), []);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    captchaRef.current?.reset();
    onChangeRef.current?.({ captchaToken: '' });
  }, [recaptchaKey]);

  const purpose = String(action || 'register').toLowerCase();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Are you a human? <span className="text-red-500">*</span>
      </label>
      {!siteKey ? (
        <div className={`rounded-lg border px-3 py-2 text-sm ${error ? 'border-red-500 text-red-600' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>
          CAPTCHA is not configured. Set `VITE_RECAPTCHA_SITE_KEY` in client environment.
        </div>
      ) : (
        <div
          className={`${disabled ? 'opacity-60 pointer-events-none' : ''} inline-block rounded-lg p-1`}
          style={{ boxShadow: `inset 0 0 0 1px ${error ? '#ef4444' : `${accent}40`}` }}
        >
          <div className="w-[268px] h-[69px] overflow-hidden sm:w-[304px] sm:h-[78px]">
            <div className="origin-top-left scale-[0.88] sm:scale-100">
              <ReCAPTCHA
                key={`${purpose}-${recaptchaKey}`}
                ref={captchaRef}
                sitekey={siteKey}
                onChange={(token) => onChangeRef.current?.({ captchaToken: token || '' })}
                onExpired={() => onChangeRef.current?.({ captchaToken: '' })}
                onErrored={() => onChangeRef.current?.({ captchaToken: '' })}
              />
            </div>
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default CaptchaField;
