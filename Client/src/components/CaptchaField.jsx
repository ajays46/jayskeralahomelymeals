import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

const CaptchaField = ({ accent, onChange, error, disabled = false, recaptchaKey = 0, action = 'register' }) => {
  const onChangeRef = useRef(onChange);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const fetchCaptcha = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/auth/captcha', {
        params: { purpose: String(action || 'register').toLowerCase() }
      });
      const imageData = data?.data?.imageData || '';
      const nextCaptchaId = data?.data?.captchaId || '';
      setCaptchaImage(imageData);
      setCaptchaId(nextCaptchaId);
      setCaptchaText('');
      onChangeRef.current?.({ captchaId: nextCaptchaId, captchaText: '' });
    } catch (e) {
      setCaptchaImage('');
      setCaptchaId('');
      setCaptchaText('');
      onChangeRef.current?.({ captchaId: '', captchaText: '' });
    } finally {
      setIsLoading(false);
    }
  }, [action]);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha, recaptchaKey]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Are you a human? <span className="text-red-500">*</span>
      </label>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[170px_auto] items-center gap-2">
          {captchaImage ? (
            <img
              src={captchaImage}
              alt="CAPTCHA challenge"
              className={`h-[56px] w-[170px] rounded border bg-white object-cover ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
          ) : (
            <div className={`h-[56px] w-[170px] rounded border bg-gray-50 flex items-center justify-center text-xs text-gray-500 ${error ? 'border-red-500' : 'border-gray-300'}`}>
              {isLoading ? 'Loading CAPTCHA...' : 'CAPTCHA unavailable'}
            </div>
          )}
          <button
            type="button"
            onClick={fetchCaptcha}
            disabled={disabled || isLoading}
            className="justify-self-end inline-flex h-[42px] w-[42px] items-center justify-center rounded-lg border transition-colors hover:bg-orange-50 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ color: accent, borderColor: accent }}
            aria-label="Refresh captcha"
            title="Refresh captcha"
          >
            <span className="text-xl leading-none text-orange-500" aria-hidden="true">↻</span>
          </button>
        </div>
        <input
          type="text"
          value={captchaText}
          onChange={(e) => {
            const value = e.target.value;
            setCaptchaText(value);
            onChangeRef.current?.({ captchaId, captchaText: value });
          }}
          placeholder="Type the characters above"
          disabled={disabled || isLoading || !captchaId}
          className={`block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${error ? 'border-red-500' : 'border-gray-300'}`}
          style={{ ['--tw-ring-color']: accent }}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default CaptchaField;
