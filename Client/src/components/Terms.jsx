import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { getTermsForCompany } from '../config/tenantTerms';
import { getThemeForCompany } from '../config/tenantThemes';
import { DEFAULT_COMPANY_PATH } from '../utils/companyPaths';

/**
 * Terms - Terms and Conditions (per company via URL path, e.g. /jkfds/terms).
 * Can be rendered as a modal (with isOpen/onClose) or as a standalone page (route).
 */
const Terms = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { companyPath: pathParam } = useParams();
  const tenant = useTenant();
  const isModal = isOpen !== undefined;

  /**
   * URL segment wins so /jlg/terms and /ml/terms always load that bundle
   * (tenant state can match session while the path is being rewritten).
   */
  const effectivePath = useMemo(() => {
    const fromUrl = pathParam != null && String(pathParam).trim() !== ''
      ? String(pathParam).trim().toLowerCase()
      : '';
    if (fromUrl) return fromUrl;
    const fromTenant = tenant?.companyPath != null && String(tenant.companyPath).trim() !== ''
      ? String(tenant.companyPath).trim().toLowerCase()
      : '';
    if (fromTenant) return fromTenant;
    return DEFAULT_COMPANY_PATH;
  }, [pathParam, tenant?.companyPath]);

  const doc = useMemo(() => getTermsForCompany(effectivePath), [effectivePath]);

  const theme = useMemo(
    () => getThemeForCompany(effectivePath, tenant?.companyName),
    [effectivePath, tenant?.companyName],
  );

  useEffect(() => {
    if (!isModal) {
      window.scrollTo(0, 0);
    }
  }, [isModal, effectivePath]);

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(-1);
  };

  /** Standalone page: leave terms view reliably (mobile has no browser chrome hint). */
  const handleClosePage = () => {
    navigate(`/${effectivePath}`, { replace: false });
  };

  const closeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const bannerStyle = {
    background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`,
  };

  const content = (
    <>
      <div
        className="rounded-xl p-4 sm:p-5 mb-6 text-white shadow-md ring-1 ring-black/10"
        style={bannerStyle}
      >
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest opacity-90">
          Tenant / URL: <span className="font-mono">{effectivePath}</span>
        </p>
        <p
          className={`text-xl sm:text-2xl mt-1 leading-snug text-white ${theme.brandDisplayFontClass || 'font-bold'}`}
          style={theme.brandDisplayTextShadow ? { textShadow: theme.brandDisplayTextShadow } : undefined}
        >
          {theme.brandName}
        </p>
        {doc.bannerTagline && (
          <p className="text-sm sm:text-base mt-2 leading-relaxed opacity-95 border-t border-white/25 pt-3">
            {doc.bannerTagline}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-tight">{doc.pageTitle}</h1>
        {isModal && (
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-full p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            aria-label="Close"
          >
            {closeIcon}
          </button>
        )}
      </div>

      <div className="space-y-8 text-gray-700">
        <p className="text-sm text-gray-500">Last Updated: {doc.lastUpdatedDisplay}</p>

        {doc.intro.map((p, i) => (
          <p key={`intro-${i}`} className="text-gray-700 leading-relaxed">
            {p}
          </p>
        ))}

        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3">{section.title}</h2>
            {section.paragraphs?.map((para) => (
              <p key={para} className="text-gray-600 mb-2 leading-relaxed">
                {para}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-1">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3">{doc.contactTitle || 'Contact'}</h2>
          <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-gray-700">
            <p className="font-medium">{doc.contact.legalName}</p>
            {doc.contact.email != null && doc.contact.email !== '' && (
              <p className="text-gray-600">
                Email: {doc.contact.email}
              </p>
            )}
            {doc.contact.extraLines?.map((line) => (
              <p key={line} className="text-gray-600">
                {line}
              </p>
            ))}
          </div>
        </section>
      </div>

      {isModal && (
        <div className="mt-8">
          <button
            type="button"
            onClick={handleClose}
            className="w-full min-h-[48px] px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      )}

      {!isModal && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClosePage}
            className="w-full min-h-[48px] px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      )}
    </>
  );

  if (isModal) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={handleClosePage}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[44px]"
            aria-label="Close terms and return to home"
          >
            {closeIcon}
            <span>Close</span>
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Terms;
