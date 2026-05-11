import { useMutation,useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { showLoginError } from '../../utils/toastConfig.jsx';
import useAuthStore, { applyAuthPersistMode } from '../../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute } from '../../utils/roleBasedRouting';
import { useCompanyBasePath } from '../../context/TenantContext';

/** Legacy global key (pre–per-company); still read for migration. */
export const REMEMBERED_LOGIN_IDENTIFIER_KEY = 'remembered_login_identifier';

const REMEMBER_ME_EXPIRY_PREFIX = 'remember_me_expires_at';

/** Survives `localStorage.clear()` on legacy logout handlers — call before clear, then restore after. */
export function preserveRememberMeLocalStorageSnapshot() {
  if (typeof localStorage === 'undefined') return [];
  const out = [];
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key === REMEMBERED_LOGIN_IDENTIFIER_KEY ||
      key === REMEMBER_ME_EXPIRY_PREFIX ||
      key === 'auth_expires_at' ||
      key.startsWith(`${REMEMBERED_LOGIN_IDENTIFIER_KEY}_`) ||
      key.startsWith(`${REMEMBER_ME_EXPIRY_PREFIX}_`)
    ) {
      out.push([key, localStorage.getItem(key)]);
    }
  }
  return out;
}

export function restoreRememberMeLocalStorageSnapshot(entries) {
  if (!entries?.length || typeof localStorage === 'undefined') return;
  for (const [key, value] of entries) {
    if (key && value != null) localStorage.setItem(key, value);
  }
}

function normalizeCompanyPathForRemember(companyPath) {
  if (companyPath == null || !String(companyPath).trim()) return '';
  return String(companyPath).toLowerCase().trim();
}

function rememberMeKeys(companyPath) {
  const suffix = companyPath ? `_${normalizeCompanyPathForRemember(companyPath)}` : '';
  return {
    identifierKey: `${REMEMBERED_LOGIN_IDENTIFIER_KEY}${suffix}`,
    expiryKey: `${REMEMBER_ME_EXPIRY_PREFIX}${suffix}`,
  };
}

/**
 * Read saved identifier for this tenant only (JKHM vs JLG vs ML are isolated).
 * When `companyPath` is set, only scoped keys are used — never a shared global (avoids wrong-company email).
 * Global keys are used only when there is no company path (legacy / non-tenant login URLs).
 */
export function getRememberedIdentifier(companyPath) {
  const cp = normalizeCompanyPathForRemember(companyPath);
  const { identifierKey, expiryKey } = rememberMeKeys(cp);

  if (cp) {
    const scopedId = localStorage.getItem(identifierKey);
    if (!scopedId) return null;
    const expiryScoped = Number(localStorage.getItem(expiryKey) || '0');
    if (expiryScoped > 0 && Date.now() > expiryScoped) {
      localStorage.removeItem(identifierKey);
      localStorage.removeItem(expiryKey);
      return null;
    }
    return scopedId;
  }

  const legacyId = localStorage.getItem(REMEMBERED_LOGIN_IDENTIFIER_KEY);
  if (!legacyId) return null;

  const expiryGlobal = Number(
    localStorage.getItem(REMEMBER_ME_EXPIRY_PREFIX) ||
      localStorage.getItem('auth_expires_at') ||
      '0'
  );
  if (expiryGlobal > 0 && Date.now() > expiryGlobal) {
    localStorage.removeItem(REMEMBERED_LOGIN_IDENTIFIER_KEY);
    localStorage.removeItem(REMEMBER_ME_EXPIRY_PREFIX);
    localStorage.removeItem('auth_expires_at');
    return null;
  }
  return legacyId;
}

function isRememberMeExplicitTrue(raw) {
  return raw === true || raw === 'true' || raw === 1 || raw === '1';
}

function isRememberMeExplicitFalse(raw) {
  return raw === false || raw === 'false' || raw === 0 || raw === '0';
}

/**
 * Persist or clear "remember me" data (email/phone only, never password).
 * Uses keys separate from auth/session storage so Zustand rehydration is not coupled to Remember Me.
 */
export function syncRememberMeStorage({ remember, identifier, companyPath }) {
  const rememberOn = isRememberMeExplicitTrue(remember);
  const cp = normalizeCompanyPathForRemember(companyPath);
  const { identifierKey, expiryKey } = rememberMeKeys(cp ? cp : undefined);

  if (rememberOn) {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const ts = String(Date.now() + sevenDaysMs);
    const id = identifier != null ? String(identifier).trim() : '';

    if (cp) {
      // Company URL present: store only under this tenant (jkhm / jlg / ml stay separate).
      localStorage.setItem(expiryKey, ts);
      if (id) {
        localStorage.setItem(identifierKey, id);
      } else {
        localStorage.removeItem(identifierKey);
        localStorage.removeItem(expiryKey);
      }
    } else {
      // No tenant in context: legacy global keys only.
      localStorage.setItem('auth_expires_at', ts);
      localStorage.setItem(REMEMBER_ME_EXPIRY_PREFIX, ts);
      if (id) {
        localStorage.setItem(REMEMBERED_LOGIN_IDENTIFIER_KEY, id);
      } else {
        localStorage.removeItem(REMEMBERED_LOGIN_IDENTIFIER_KEY);
      }
    }
  } else if (isRememberMeExplicitFalse(remember)) {
    if (cp) {
      localStorage.removeItem(expiryKey);
      localStorage.removeItem(identifierKey);
    } else {
      localStorage.removeItem(expiryKey);
      localStorage.removeItem(identifierKey);
      localStorage.removeItem('auth_expires_at');
      localStorage.removeItem(REMEMBERED_LOGIN_IDENTIFIER_KEY);
      localStorage.removeItem(REMEMBER_ME_EXPIRY_PREFIX);
    }
  }
}

export const useLogin = () => {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRoles = useAuthStore((state) => state.setRoles);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setShowRoleSelector = useAuthStore((state) => state.setShowRoleSelector);
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);       
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        const roles = data.data.roles || [data.data.role];
        const primaryRole = roles[0];
        const rememberRaw = variables?.remember;
        const rememberOn = isRememberMeExplicitTrue(rememberRaw);
        const rememberOff = isRememberMeExplicitFalse(rememberRaw);

        applyAuthPersistMode(rememberOn);

        // Must run here (global onSuccess), not only in Login’s `mutate(..., { onSuccess })`).
        // TanStack Query v5 runs per-mutate callbacks only when the observer still has listeners;
        // after navigation / modal close / Strict Mode that can be skipped — then nothing is saved.
        // Only touch remember-me keys when checkbox is explicitly true/false — avoids wiping on bad payloads.
        if (rememberOn || rememberOff) {
          syncRememberMeStorage({
            remember: rememberOn,
            identifier: variables?.identifier,
            companyPath: variables?.companyPath || data.data?.companyPath,
          });
        }

        setAccessToken(data.accessToken);
        setRoles(roles);
        setActiveRole(primaryRole);
        setUser(data.data);
        setIsAuthenticated(true);
        // Store company_id for multicompany (X-Company-ID header)
        if (data.data?.companyId) {
          localStorage.setItem('company_id', data.data.companyId);
        }
        const targetBasePath = data.data?.companyPath ? `/${String(data.data.companyPath).trim()}` : basePath;
        const isMl = (data.data?.companyPath || '').toLowerCase() === 'ml';
        // Small delay to ensure AuthSlider closes first
        setTimeout(() => {
          // ML company: never show role selector; always go directly to role dashboard (e.g. CXO → cxo-dashboard)
          if (isMl) {
            const dashboardRoute = getDashboardRoute(roles, targetBasePath);
            navigate(dashboardRoute, { replace: true });
          } else if (roles.length > 1) {
            if (data.data?.companyPath) navigate(targetBasePath, { replace: true });
            setShowRoleSelector(true);
          } else {
            const dashboardRoute = getDashboardRoute(roles, targetBasePath);
            navigate(dashboardRoute, { replace: true });
          }
        }, 100);
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.toLowerCase().includes('invalid')) {
        // Do not show Toastify for invalid credentials, let Login.jsx handle it inline
        return;
      }
      showLoginError({ response: { data: { message: errorMessage } } });
    }
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      localStorage.removeItem('company_id');
      logout();
      navigate(basePath);
    },
    onError: (error) => {
      localStorage.removeItem('company_id');
      logout();
      navigate(basePath);
    }
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    },
    onError: (error) => {
      if (!error.config?._retry) {
        const errorMessage = error.response?.data?.message || 'Session expired. Please login again.';
        showLoginError({ response: { data: { message: errorMessage } } });
      }
    }
  });
}; 

export const useUsersList = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/auth/home');
      return response.data;
    }
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (identifier) => {
      const response = await api.post('/auth/forgot-password', { identifier });
      return response.data;
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link.';
      showLoginError({ response: { data: { message: errorMessage } } });
    }
  });
};