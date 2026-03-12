/**
 * CxoMenuDemand – reusable Menu demand block for CXO dashboard.
 * Use in MLCXODashboard or elsewhere; parent can pass data from useCxoMenuDemand or another source.
 */
import React from 'react';
import { MdRestaurant, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { Spin } from 'antd';

const CxoMenuDemand = ({
  items = [],
  isLoading = false,
  error = null,
  accentColor = '#E85D04',
  expanded = true,
  onToggleExpand,
  sectionId,
  limit = 10,
  className = '',
  emptyMessage = 'No data for selected period.',
}) => {
  const list = (items || []).slice(0, limit);

  return (
    <section
      id={sectionId}
      className={`rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden scroll-mt-4 ${className}`.trim()}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
      >
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MdRestaurant style={{ color: accentColor }} /> Menu demand
        </h2>
        {expanded ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
      </button>
      {expanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 max-h-[320px] sm:max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="py-8 flex justify-center">
              <Spin />
            </div>
          )}
          {error && (
            <p className="py-4 text-sm text-red-600">
              {error?.response?.data?.message || error?.message || 'Failed to load menu demand.'}
            </p>
          )}
          {!isLoading && !error && (
            <ul className="space-y-2 pt-4">
              {list.map((item, i) => (
                <li
                  key={item.menu_item_id || i}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 gap-2"
                >
                  <span className="font-medium text-gray-800 truncate min-w-0">{item.menu_item_name || '—'}</span>
                  <span className="text-sm text-gray-600 flex-shrink-0">
                    {item.total_quantity ?? 0} qty · {item.total_orders ?? 0} orders
                  </span>
                </li>
              ))}
              {list.length === 0 && <p className="text-sm text-gray-500 py-4">{emptyMessage}</p>}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default CxoMenuDemand;
