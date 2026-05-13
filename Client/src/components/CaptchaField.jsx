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
        Human Verification <span className="text-red-500">*</span>
      </label>
      <div className={`rounded-lg border p-3 ${error ? 'border-red-500' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between gap-2">
          {captchaImage ? (
            <img src={captchaImage} alt="CAPTCHA challenge" className="h-[56px] w-[170px] rounded border border-gray-300 bg-white object-cover" />
          ) : (
            <div className="h-[56px] w-[170px] rounded border border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-500">
              {isLoading ? 'Loading CAPTCHA...' : 'CAPTCHA unavailable'}
            </div>
          )}
          <button
            type="button"
            onClick={fetchCaptcha}
            disabled={disabled || isLoading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ color: accent, borderColor: accent }}
          >
            Refresh
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
          placeholder="Enter CAPTCHA code"
          disabled={disabled || isLoading || !captchaId}
          className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2"
          style={{ ['--tw-ring-color']: accent }}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default CaptchaField;
