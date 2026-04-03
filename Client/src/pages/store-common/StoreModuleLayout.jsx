import React, { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import useAuthStore from '../../stores/Zustand.store';
import { useLogout } from '../../hooks/userHooks/useLogin';

/** @feature kitchen-store — Tenant layout: store manager / store operator navigation shell. */
const managerLinks = [
  { to: 'store-manager/kitchen-dashboard', label: 'Manager Dashboard' },
  { to: 'store-manager/purchase-requests', label: 'Purchase Request Inbox' },
  { to: 'store-manager/purchase-receipts', label: 'Purchase Receipts' },
  { to: 'store-manager/purchase-comparison', label: 'Purchase Comparison' },
  { to: 'store-manager/off-list-review', label: 'Purchase Manager Review' },
  { to: 'store-manager/inventory', label: 'Inventory View' },
  { to: 'store-manager/stock-logs', label: 'Stock Logs' },
  { to: 'store-manager/recipe-bom', label: 'Recipe / BOM' },
  { to: 'store-manager/plan-list', label: 'Plan List' },
  { to: 'store-manager/plan-approval', label: 'Plan Approval' },
  { to: 'store-manager/reports', label: 'Reports' },
  { to: 'store-manager/forecast', label: 'Forecast' },
  { to: 'store-manager/purchase-suggestions', label: 'Purchase Suggestions' }
];

const operatorLinks = [
  { to: 'store-operator/inventory', label: 'Operator Inventory' },
  { to: 'store-operator/item-master', label: 'Create inventory' },
  { to: 'store-operator/brand-master', label: 'Create brand' },
  { to: 'store-operator/purchase-requests', label: 'Create Purchase Request' },
  { to: 'store-operator/approved-requests', label: 'Approved Requests' },
  { to: 'store-operator/purchases', label: 'Purchase Receipts' },
  { to: 'store-operator/issue', label: 'Issue to Kitchen' },
  { to: 'store-operator/adjustments', label: 'Adjustments' },
  { to: 'store-operator/meal-report', label: 'Meal Report' }
];

const linkClassName = ({ isActive }) =>
  `block rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
    isActive
      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
      : 'text-slate-600 hover:bg-slate-100'
  }`;

/** Scrollable when needed, but no visible scrollbar (Firefox / WebKit / legacy Edge). */
const sidebarOverflowClass =
  'overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const storeLogoSrc = `${import.meta.env.BASE_URL}logo.png`;

/** Circular brand mark from `public/logo.png` (decorative; title is adjacent). */
const StoreBrandMark = ({ className }) => (
  <div
    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-1 ring-slate-200/50 ${className ?? ''}`}
  >
    <img src={storeLogoSrc} alt="" className="h-full w-full object-contain object-center" />
  </div>
);

const StoreModuleLayout = () => {
  const basePath = useCompanyBasePath();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = useLogout();

  const roleString = String(user?.role || '').toUpperCase();
  const roles = (Array.isArray(user?.roles) ? user.roles : roleString ? [roleString] : []).map((r) =>
    String(r).toUpperCase()
  );

  const showManager = roles.includes('STORE_MANAGER') || roleString === 'STORE_MANAGER';
  const showOperator = roles.includes('STORE_OPERATOR') || roleString === 'STORE_OPERATOR';

  const navSections = useMemo(() => {
    const sections = [];
    if (showManager) sections.push({ title: 'Store Manager', links: managerLinks });
    if (showOperator) sections.push({ title: 'Store Operator', links: operatorLinks });
    // Fallback: show all if role metadata is missing to avoid blocking navigation
    if (!showManager && !showOperator) {
      sections.push({ title: 'Store Manager', links: managerLinks });
      sections.push({ title: 'Store Operator', links: operatorLinks });
    }
    return sections;
  }, [showManager, showOperator]);

  const handleLogout = () => {
    if (logoutMutation.isPending) return;
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#eef2f5]">
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <StoreBrandMark className="h-9 w-9" />
          <h1 className="m-0 flex h-9 items-center text-base font-bold leading-none text-slate-900">
            Kitchen Inventory
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((s) => !s)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {mobileOpen ? 'Close Menu' : 'Menu'}
        </button>
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={`relative h-full w-80 max-w-[85vw] border-r border-slate-200/80 bg-white p-5 shadow-xl ${sidebarOverflowClass}`}
          >
            <div className="mb-6 flex items-center gap-3">
              <StoreBrandMark className="h-11 w-11" />
              <h1 className="m-0 flex h-11 items-center text-lg font-bold leading-none text-slate-900">
                Kitchen Inventory
              </h1>
            </div>
            {navSections.map((section) => (
              <div key={`mobile-${section.title}`} className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.title}</p>
                <div className="space-y-1">
                  {section.links.map((link) => (
                    <NavLink
                      key={`mobile-${link.to}`}
                      to={`${basePath}/${link.to}`}
                      className={linkClassName}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="mt-6 w-full rounded-xl border border-red-200/90 bg-white px-3 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
            >
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </button>
          </aside>
        </div>
      ) : null}

      {/* Desktop fixed sidebar + scrollable right content */}
      <aside
        className={`fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200/80 bg-white p-5 lg:block ${sidebarOverflowClass}`}
      >
        <div className="mb-6 flex items-center gap-3">
          <StoreBrandMark className="h-11 w-11" />
          <h1 className="m-0 flex h-11 items-center text-lg font-bold leading-none text-slate-900">
            Kitchen Inventory
          </h1>
        </div>

        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.title}</p>
            <div className="space-y-1">
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={`${basePath}/${link.to}`}
                  className={linkClassName}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="mt-6 w-full rounded-xl border border-red-200/90 bg-white px-3 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </aside>

      <div className="lg:ml-72">
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StoreModuleLayout;

