import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getThemeForCompany } from '../config/tenantThemes';
import { DEFAULT_COMPANY_PATH } from '../utils/companyPaths';
import useAuthStore from '../stores/Zustand.store';

const TenantContext = createContext(null);

function tenantPathMatchesSessionUser(path, authState) {
  if (!path || !authState?.isAuthenticated || !authState?.user?.companyId) return false;
  const u = String(authState.user.companyPath || '').toLowerCase().trim();
  return u.length > 0 && u === String(path).toLowerCase().trim();
}

function initialTenantState(urlCompanyPath) {
  const path = urlCompanyPath?.trim() || null;
  if (!path) {
    return { companyId: null, companyName: null, companyPath: null, loading: false, error: null };
  }
  const auth = useAuthStore.getState();
  if (tenantPathMatchesSessionUser(path, auth)) {
    return {
      companyId: auth.user.companyId,
      companyName: auth.user.companyName || null,
      companyPath: path,
      loading: false,
      error: null,
    };
  }
  return { companyId: null, companyName: null, companyPath: path, loading: true, error: null };
}

export function TenantProvider({ children }) {
  const { companyPath } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(() => initialTenantState(companyPath));

  const resolveCompany = useCallback(async (path) => {
    if (!path || !path.trim()) return null;
    try {
      const res = await api.get(`/company-by-path/${encodeURIComponent(path.trim())}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const path = companyPath?.trim() || null;
    if (!path) {
      setState((s) => ({ ...s, loading: false, error: null, companyId: null, companyName: null, companyPath: null }));
      return;
    }
    const auth = useAuthStore.getState();
    const sessionMatch = tenantPathMatchesSessionUser(path, auth);

    // Avoid blocking the whole tenant shell (Outlet + role selector) while /company-by-path
    // loads when we already know this tenant from the session right after login.
    if (sessionMatch) {
      setState((s) => ({
        ...s,
        companyId: auth.user.companyId,
        companyName: auth.user.companyName ?? s.companyName ?? null,
        companyPath: path,
        loading: false,
        error: null,
      }));
    } else {
      setState((s) => ({
        ...s,
        loading: true,
        error: null,
        companyPath: path,
      }));
    }

    let cancelled = false;
    resolveCompany(path)
      .then((company) => {
        if (cancelled) return;
        if (company) {
          setState({
            companyId: company.id,
            companyName: company.name,
            companyPath: path,
            loading: false,
            error: null,
          });
        } else {
          setState({
            companyId: null,
            companyName: null,
            companyPath: path,
            loading: false,
            error: 'Company not found',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: 'Failed to load company',
            companyId: null,
            companyName: null,
          }));
        }
      });
    return () => { cancelled = true; };
  }, [companyPath, resolveCompany]);

  const theme = useMemo(
    () => getThemeForCompany(state.companyPath, state.companyName),
    [state.companyPath, state.companyName]
  );

  const value = {
    ...state,
    theme,
    defaultCompanyPath: DEFAULT_COMPANY_PATH,
    redirectToDefault: () => navigate(`/${DEFAULT_COMPANY_PATH}`, { replace: true }),
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  return ctx;
}

/** Hook: base path for current tenant (e.g. /jkhm). Use for links and navigate. */
export function useCompanyBasePath() {
  const tenant = useTenant();
  const path = tenant?.companyPath || DEFAULT_COMPANY_PATH;
  return `/${path}`;
}

export { DEFAULT_COMPANY_PATH } from '../utils/companyPaths';
