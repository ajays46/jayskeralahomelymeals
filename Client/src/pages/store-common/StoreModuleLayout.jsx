import React, { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import useAuthStore from '../../stores/Zustand.store';

const managerLinks = [
  { to: 'store-manager/kitchen-dashboard', label: 'Manager Dashboard' },
  { to: 'store-manager/item-master', label: 'Item Master' },
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
  { to: 'store-operator/purchases', label: 'Purchase Receipts' },
  { to: 'store-operator/issue', label: 'Issue to Kitchen' },
  { to: 'store-operator/adjustments', label: 'Adjustments' },
  { to: 'store-operator/meal-report', label: 'Meal Report' }
];

const linkClassName = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
  }`;

const StoreModuleLayout = () => {
  const basePath = useCompanyBasePath();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Kitchen Inventory</h1>
        <button
          type="button"
          onClick={() => setMobileOpen((s) => !s)}
          className="px-3 py-1.5 rounded-md border text-sm text-gray-700"
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
          <aside className="relative h-full w-80 max-w-[85vw] bg-white border-r p-4 overflow-y-auto">
            <div className="mb-4">
              <h1 className="text-xl font-semibold text-gray-900">Kitchen Inventory</h1>
              <p className="text-xs text-gray-500 mt-1">Company scope: {basePath}</p>
            </div>
            {navSections.map((section) => (
              <div key={`mobile-${section.title}`} className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {section.title}
                </p>
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
          </aside>
        </div>
      ) : null}

      {/* Desktop fixed sidebar + scrollable right content */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-72 bg-white border-r p-4 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Kitchen Inventory</h1>
          <p className="text-xs text-gray-500 mt-1">Company scope: {basePath}</p>
        </div>

        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {section.title}
            </p>
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

