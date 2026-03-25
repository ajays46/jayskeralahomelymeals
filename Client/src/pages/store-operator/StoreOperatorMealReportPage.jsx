import React, { useMemo, useState } from 'react';
import { useKitchenMealReportApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

const defaultDate = new Date().toISOString().slice(0, 10);

const sessionOrder = ['BREAKFAST', 'LUNCH', 'DINNER'];

const toLabel = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatSessionRows = (sessionsRaw) => {
  if (!sessionsRaw) return [];

  if (Array.isArray(sessionsRaw)) {
    return sessionsRaw.map((session) => ({
      session: session.session || session.meal_slot || '',
      total: Number(session.total || session.total_count || 0),
      locations: Array.isArray(session.locations) ? session.locations : []
    }));
  }

  return Object.entries(sessionsRaw).map(([sessionName, sessionValue]) => {
    const locationsRaw = sessionValue?.locations || sessionValue?.location_counts || {};
    const locations = Array.isArray(locationsRaw)
      ? locationsRaw
      : Object.entries(locationsRaw).map(([location, count]) => ({ location, count }));

    return {
      session: sessionName,
      total: Number(sessionValue?.total || sessionValue?.total_count || 0),
      locations
    };
  });
};

const StoreOperatorMealReportPage = () => {
  const { getMealReport } = useKitchenMealReportApi();
  const [date, setDate] = useState(defaultDate);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sessions = useMemo(() => {
    const rows = formatSessionRows(report?.sessions);
    return rows.sort((a, b) => {
      const aIdx = sessionOrder.indexOf(String(a.session || '').toUpperCase());
      const bIdx = sessionOrder.indexOf(String(b.session || '').toUpperCase());
      const safeA = aIdx === -1 ? 999 : aIdx;
      const safeB = bIdx === -1 ? 999 : bIdx;
      return safeA - safeB;
    });
  }, [report]);

  const onLoadReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await getMealReport(date);
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load meal report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Meal Report"
        description="Loads operator meal report from GET /api/kitchen-store/meal-report?date=YYYY-MM-DD."
      />
      <StoreSection title="Load Report">
        <form onSubmit={onLoadReport} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-sm text-gray-600">Report date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block border rounded-md px-3 py-2"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Load Report'}
            </Button>
          </form>

          {error ? (
            <div className="mt-4 border border-red-300 rounded-md p-3 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </StoreSection>

        {report ? (
          <>
            <StoreStatGrid>
              <StoreStatCard label="Sessions" value={sessions.length} />
              <StoreStatCard label="Totals Keys" value={report.totals ? Object.keys(report.totals).length : 0} />
              <StoreStatCard label="Report Date" value={date} />
            </StoreStatGrid>
            <StoreSection title="Formatted Report">
              <div className="mt-2 border rounded-md bg-gray-50 p-4">
                {report.text_report ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {report.text_report}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500">No text_report received. Showing structured data below.</p>
                )}
              </div>
            </StoreSection>

            <StoreSection title="Session Breakdown">
              {sessions.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No session data available for this date.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sessions.map((session) => (
                    <div key={session.session} className="border rounded-md p-4 bg-gray-50">
                      <p className="text-sm text-gray-500">{toLabel(session.session)}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{session.total}</p>
                      <div className="mt-3 space-y-1">
                        {(Array.isArray(session.locations) ? session.locations : []).map((loc, idx) => (
                          <p key={`${session.session}-${loc.location || idx}`} className="text-sm text-gray-700">
                            {toLabel(loc.location || 'Unknown')}: <span className="font-semibold">{Number(loc.count || 0)}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </StoreSection>

            <StoreSection title="Totals">
              {report.totals && Object.keys(report.totals).length > 0 ? (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(report.totals).map(([key, value]) => (
                    <div key={key} className="border rounded-md p-3 bg-white">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{toLabel(key)}</p>
                      <p className="text-lg font-semibold text-gray-900">{Number(value || 0)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No totals returned.</p>
              )}
            </StoreSection>
          </>
        ) : null}
    </StorePageShell>
  );
};

export default StoreOperatorMealReportPage;
