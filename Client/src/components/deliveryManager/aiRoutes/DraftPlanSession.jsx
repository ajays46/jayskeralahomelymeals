import React, { useState, useMemo, useEffect } from 'react';
import { FiSearch, FiFileText, FiCheckCircle, FiDownload } from 'react-icons/fi';
import { Popconfirm } from 'antd';

const formatSessionLabel = (session) =>
  (session ?? '').replace(/\b\w/g, (c) => c.toUpperCase());

const STORAGE_KEY_APPROVED = 'aiRoute_approvedDrafts';

function loadApprovedFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPROVED);
    if (!raw) return { approvedKeys: [], exportUrlsByKey: {} };
    const parsed = JSON.parse(raw);
    return {
      approvedKeys: Array.isArray(parsed.approvedKeys) ? parsed.approvedKeys : [],
      exportUrlsByKey: parsed.exportUrlsByKey && typeof parsed.exportUrlsByKey === 'object' ? parsed.exportUrlsByKey : {}
    };
  } catch {
    return { approvedKeys: [], exportUrlsByKey: {} };
  }
}

function saveApprovedToStorage(approvedKeys, exportUrlsByKey) {
  try {
    localStorage.setItem(STORAGE_KEY_APPROVED, JSON.stringify({
      approvedKeys: Array.from(approvedKeys),
      exportUrlsByKey: exportUrlsByKey || {}
    }));
  } catch (e) {
    console.warn('Could not persist approved drafts to localStorage', e);
  }
}

/** Trigger file download from URL; falls back to opening in new tab if fetch fails (e.g. CORS) */
const downloadFromUrl = async (url, filename) => {
  if (!url) return;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'download';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * DraftPlanSession - Route Planning Details with multiple stored drafts.
 * draftPlans: { [date_session]: { plan, comparison } }
 * User selects which draft to view via Delivery date + Meal type.
 */
const DraftPlanSession = ({
  draftPlans = {},
  currentDeliveryDate,
  currentDeliverySession,
  onApproveRoute,
  showSuccessToast,
  showErrorToast
}) => {
  const [filterDelivery, setFilterDelivery] = useState('');
  const [filterExecutive, setFilterExecutive] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [approvedDraftKeys, setApprovedDraftKeys] = useState(() => {
    const { approvedKeys } = loadApprovedFromStorage();
    return new Set(approvedKeys);
  });
  // Export URLs per draft key after approve: { [key]: { s3_url, s3_url_txt, filename, filename_txt } }
  const [exportUrlsByKey, setExportUrlsByKey] = useState(() => {
    const { exportUrlsByKey: urls } = loadApprovedFromStorage();
    return urls;
  });

  const draftKeys = useMemo(
    () => Object.keys(draftPlans).sort((a, b) => a.localeCompare(b)),
    [draftPlans]
  );

  const draftOptions = useMemo(
    () =>
      draftKeys.map((key) => {
        const [date, ...sessionParts] = key.split('_');
        const session = sessionParts.join('_');
        return {
          key,
          date,
          session,
          label: `${date} · ${formatSessionLabel(session)}`
        };
      }),
    [draftKeys]
  );

  const [selectedDraftKey, setSelectedDraftKey] = useState('');

  useEffect(() => {
    if (draftKeys.length === 0) return;
    const currentKey = currentDeliveryDate && currentDeliverySession ? `${currentDeliveryDate}_${currentDeliverySession}` : null;
    const preferred = currentKey && draftPlans[currentKey] ? currentKey : draftKeys[0];
    if (!draftPlans[selectedDraftKey]) {
      setSelectedDraftKey(preferred);
    }
  }, [draftKeys, draftPlans, currentDeliveryDate, currentDeliverySession, selectedDraftKey]);

  const selected = draftPlans[selectedDraftKey];
  const routePlan = selected?.plan ?? null;
  const routeComparison = selected?.comparison ?? null;

  const routes = routePlan?.routes?.routes ?? [];
  const sessionLabel = routePlan ? formatSessionLabel(routePlan.delivery_session) : '—';

  const allRows = useMemo(() => {
    if (!routePlan) return [];
    const rows = [];
    routes.forEach((route) => {
      const executiveName = route.executive?.name ?? route.driver_name ?? '—';
      const executivePhone = route.executive?.whatsapp_number ?? route.executive?.phone_number ?? '';
      const executiveLabel = executivePhone ? `${executiveName} (${executivePhone})` : executiveName;
      const stops = route.stops ?? [];
      const routeDistanceKm = route.total_distance_km;
      const routeTimeHours = route.estimated_time_hours;

      stops.forEach((stop, stopIdx) => {
        const deliveryName = stop.customer_name ?? ([stop.first_name, stop.last_name].filter(Boolean).join(' ') || '—');
        const location = [stop.housename, stop.street, stop.address].filter(Boolean).join(', ') || (stop.address || stop.street || '—');
        const packages = stop.packages ?? 1;
        const stopNum = stopIdx + 1;

        rows.push({
          stopNum,
          deliveryName,
          executive: executiveLabel,
          location,
          packages,
          distanceKm: '—',
          timeMin: '—',
          mapLink: stop.map_link ?? stop.location_link ?? (stop.latitude != null && stop.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}` : null),
          routeId: route.route_id
        });
      });

      rows.push({
        stopNum: stops.length + 1,
        deliveryName: 'Return to Hub',
        executive: executiveLabel,
        location: '—',
        packages: '—',
        distanceKm: routeDistanceKm != null ? routeDistanceKm.toFixed(2) : '—',
        timeMin: routeTimeHours != null ? (routeTimeHours * 60).toFixed(1) : '—',
        mapLink: null,
        isReturnToHub: true
      });
    });
    return rows;
  }, [routePlan, routes]);

  const filteredRows = useMemo(() => {
    const d = filterDelivery.trim().toLowerCase();
    const e = filterExecutive.trim().toLowerCase();
    const l = filterLocation.trim().toLowerCase();
    if (!d && !e && !l) return allRows;
    return allRows.filter((row) => {
      if (d && !row.deliveryName.toLowerCase().includes(d)) return false;
      if (e && !row.executive.toLowerCase().includes(e)) return false;
      if (l && !row.location.toLowerCase().includes(l)) return false;
      return true;
    });
  }, [allRows, filterDelivery, filterExecutive, filterLocation]);

  const clearFilters = () => {
    setFilterDelivery('');
    setFilterExecutive('');
    setFilterLocation('');
  };

  const handleApprove = async () => {
    if (!routePlan || !onApproveRoute) return;
    try {
      const data = await onApproveRoute(routePlan);
      const newApprovedKeys = new Set([...approvedDraftKeys, selectedDraftKey]);
      const newExportUrls =
        data && (data.s3_url || data.s3_url_txt)
          ? {
              ...exportUrlsByKey,
              [selectedDraftKey]: {
                s3_url: data.s3_url,
                s3_url_txt: data.s3_url_txt,
                filename: data.filename,
                filename_txt: data.filename_txt
              }
            }
          : exportUrlsByKey;
      setApprovedDraftKeys(newApprovedKeys);
      if (data && (data.s3_url || data.s3_url_txt)) {
        setExportUrlsByKey(newExportUrls);
      }
      saveApprovedToStorage(newApprovedKeys, newExportUrls);
    } catch (error) {
      console.error('Error approving route:', error);
      if (showErrorToast) showErrorToast(error?.message || 'Failed to approve route');
    }
  };

  const isApproved = approvedDraftKeys.has(selectedDraftKey);
  const exportUrls = exportUrlsByKey[selectedDraftKey];

  if (draftKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FiFileText className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No draft plan yet</p>
        <p className="text-xs mt-1">
          Plan a route from the <span className="text-blue-400">Route Planning</span> tab to see drafts here. Each session (Breakfast, Lunch, Dinner) is stored and can be selected by Meal Type.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-4">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FiFileText className="text-amber-400 text-xl" />
          <h3 className="text-lg font-semibold text-white">Route Planning Details</h3>
        </div>
        {/* Approve button, or Approved + Export (Excel / TXT) buttons - top right */}
        {onApproveRoute && routePlan && (
          isApproved ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg text-sm font-semibold">
                <FiCheckCircle className="w-4 h-4" />
                Approved
              </span>
              {exportUrls && (
                <>
                  {exportUrls.s3_url && (
                    <button
                      type="button"
                      onClick={() => downloadFromUrl(exportUrls.s3_url, exportUrls.filename || 'route_plan.xlsx')}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow"
                    >
                      <FiDownload className="w-4 h-4" />
                      Export (Excel)
                    </button>
                  )}
                  {exportUrls.s3_url_txt && (
                    <button
                      type="button"
                      onClick={() => downloadFromUrl(exportUrls.s3_url_txt, exportUrls.filename_txt || 'route_plan.txt')}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-semibold transition-colors shadow"
                    >
                      <FiDownload className="w-4 h-4" />
                      Export (TXT)
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <Popconfirm
              title="Approve Route"
              description={
                <div>
                  <p>Are you sure you want to approve this route?</p>
                  <div className="mt-2 text-xs text-gray-600">
                    <p><strong>Date:</strong> {routePlan.delivery_date ?? '—'}</p>
                    <p><strong>Session:</strong> {sessionLabel}</p>
                    <p><strong>Executives:</strong> {routePlan.num_drivers ?? 0}</p>
                    <p><strong>Deliveries:</strong> {routePlan.total_deliveries ?? 0}</p>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Once approved, this route will be saved and ready for execution.
                  </p>
                </div>
              }
              icon={<FiCheckCircle className="text-green-500 inline mt-1" />}
              okText="Yes, Approve"
              cancelText="Cancel"
              onConfirm={handleApprove}
            >
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-colors shadow"
              >
                <FiCheckCircle className="w-4 h-4" />
                Approve
              </button>
            </Popconfirm>
          )
        )}
      </div>

      {/* Meal type / Draft selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-400">Meal Type:</span>
          <select
            value={selectedDraftKey}
            onChange={(e) => setSelectedDraftKey(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            {draftOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter section */}
      <div className="rounded-lg border border-gray-600 bg-gray-800/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiSearch className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filter Routes</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by delivery name..."
            value={filterDelivery}
            onChange={(e) => setFilterDelivery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Search by executive..."
            value={filterExecutive}
            onChange={(e) => setFilterExecutive(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Search by location..."
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={clearFilters}
          className="mt-3 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Table section header */}
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-white">{sessionLabel} Routes</h4>
        <span className="text-sm text-gray-400">
          {filteredRows.length} of {allRows.length} stops
        </span>
      </div>

      {/* Routes table */}
      <div className="overflow-x-auto rounded-lg border border-gray-600 bg-gray-800/50">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-gray-600 bg-gray-700/50">
              <th className="px-3 py-3 text-left font-medium text-gray-300 w-14">STOP</th>
              <th className="px-3 py-3 text-left font-medium text-gray-300 min-w-[140px]">DELIVERY NAME</th>
              <th className="px-3 py-3 text-left font-medium text-gray-300 min-w-[180px]">EXECUTIVE</th>
              <th className="px-3 py-3 text-left font-medium text-gray-300 min-w-[200px]">LOCATION</th>
              <th className="px-3 py-3 text-center font-medium text-gray-300 w-24">PACKAGES</th>
              <th className="px-3 py-3 text-right font-medium text-gray-300 w-28">DISTANCE (KM)</th>
              <th className="px-3 py-3 text-right font-medium text-gray-300 w-24">TIME (MIN)</th>
              <th className="px-3 py-3 text-center font-medium text-gray-300 w-28">MAP LINK</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {filteredRows.map((row, idx) => (
              <tr key={`${row.routeId ?? idx}-${row.stopNum}-${row.deliveryName}`} className="border-b border-gray-700 hover:bg-gray-700/20">
                <td className="px-3 py-2.5 text-white font-medium">{row.stopNum}</td>
                <td className="px-3 py-2.5 text-white">{row.deliveryName}</td>
                <td className="px-3 py-2.5 text-gray-300">{row.executive}</td>
                <td className="px-3 py-2.5 text-gray-400 max-w-[240px] truncate" title={row.location}>
                  {row.location}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {row.isReturnToHub ? (
                    <span className="text-gray-500">—</span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">
                      {row.packages}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right text-white">
                  {row.distanceKm === '—' ? '—' : `${row.distanceKm} km`}
                </td>
                <td className="px-3 py-2.5 text-right text-white">
                  {row.timeMin === '—' ? '—' : `${row.timeMin} min`}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {row.mapLink ? (
                    <a
                      href={row.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                    >
                      View Map
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {routeComparison && (
        <div className="rounded-lg border border-gray-600 bg-gray-800/50 p-3 text-sm text-gray-400">
          <span className="font-medium text-gray-300">Comparison: </span>
          AI {routeComparison.ai_distance_km?.toFixed(2) ?? '—'} km / {routeComparison.ai_time_hours != null ? (routeComparison.ai_time_hours * 60).toFixed(0) : '—'} min
          {' · '}
          Baseline {routeComparison.baseline_distance_km?.toFixed(2) ?? '—'} km / {routeComparison.baseline_time_hours != null ? (routeComparison.baseline_time_hours * 60).toFixed(0) : '—'} min
          {' · '}
          <span className="capitalize text-white">{routeComparison.recommendation?.replace(/_/g, ' ') ?? '—'}</span>
        </div>
      )}

      {routePlan?.warnings && Array.isArray(routePlan.warnings) && routePlan.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-600/50 bg-amber-900/20 p-3 text-xs text-amber-200/90">
          {routePlan.warnings.join('; ')}
        </div>
      )}
    </div>
  );
};

export default DraftPlanSession;
