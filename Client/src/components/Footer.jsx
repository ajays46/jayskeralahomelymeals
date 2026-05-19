import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { APP_VERSION } from '../config/appVersion';
import { DEFAULT_COMPANY_PATH } from '../utils/companyPaths';
import { useTenant } from '../context/TenantContext';
import { getTermsForCompany } from '../config/tenantTerms';
import { getThemeForCompany } from '../config/tenantThemes';

/**
 * Footer - Copyright footer component
 * Displays copyright information for the application
 * Format: © [Year] [Company Name]. All rights reserved.
 */
const Footer = () => {
  const tenant = useTenant();
  const location = useLocation();
  const { companyPath } = useParams();
  const pathSegment = String(location?.pathname || '')
    .split('/')
    .filter(Boolean)[0];
  const tenantBase = (
    (pathSegment && String(pathSegment).trim()) ||
    (tenant?.companyPath && String(tenant.companyPath).trim()) ||
    (companyPath && String(companyPath).trim()) ||
    DEFAULT_COMPANY_PATH
  ).toLowerCase();
  const copyrightYear = new Date().getFullYear();
  const termsDoc = getTermsForCompany(tenantBase);
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const footerAccent = theme?.accentColor || theme?.primaryColor || '#FE8C00';
  const footerCompanyNamesByPath = {
    jkfds: 'Jays Kerala kitchen',
    jkkfds: 'Jays Kerala kitchen',
    jlg: 'Jays leefy greens',
    ml: 'Maxhub logistcis',
  };
  const companyName =
    footerCompanyNamesByPath[tenantBase] ||
    termsDoc?.contact?.legalName ||
    'JAYS KERALA INNOVATIONS PRIVATE LIMITED';

  return (
    <footer
      className="py-6 mt-auto text-slate-700"
      style={{
        backgroundColor: '#f8f8f6',
        borderTop: `1px solid ${footerAccent}55`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2">
          <p className="text-sm">
            © {copyrightYear} {companyName}. All rights reserved.
          </p>
          <p className="text-xs text-slate-500" aria-label={`Application version ${APP_VERSION}`}>
            V {APP_VERSION}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

