import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useKitchenMealReportApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

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

const writeLinesToPdf = (pdf, lines, margin, maxWidth, lineHeight, startY = margin) => {
  const pageH = pdf.internal.pageSize.getHeight();
  let y = startY;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  for (const line of lines) {
    if (line === '') {
      if (y + lineHeight > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
      y += lineHeight;
      continue;
    }
    const wrapped = pdf.splitTextToSize(String(line), maxWidth);
    for (const w of wrapped) {
      if (y + lineHeight > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(w, margin, y);
      y += lineHeight;
    }
  }
  return y;
};

const addPdfPageIfNeeded = (pdf, y, margin, minSpace = 0) => {
  const pageH = pdf.internal.pageSize.getHeight();
  if (y + minSpace > pageH - margin) {
    pdf.addPage();
    return margin;
  }
  return y;
};

const drawSectionTitle = (pdf, title, y, margin) => {
  y = addPdfPageIfNeeded(pdf, y, margin, 8);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(title, margin, y);
  return y + 6;
};

const drawSimpleTable = (pdf, columns, rows, y, margin) => {
  const pageW = pdf.internal.pageSize.getWidth();
  const tableW = pageW - margin * 2;
  const headerH = 7;
  const rowH = 6;
  const lineH = 4.5;
  const widths = columns.map((col) => tableW * col.width);

  y = addPdfPageIfNeeded(pdf, y, margin, headerH + rowH);
  pdf.setFillColor(245, 247, 250);
  pdf.rect(margin, y - 4.5, tableW, headerH, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);

  let x = margin;
  columns.forEach((col, i) => {
    pdf.text(col.label, x + 1.5, y);
    x += widths[i];
  });
  y += headerH;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  rows.forEach((row) => {
    const cellLines = columns.map((col, i) => pdf.splitTextToSize(String(row[i] ?? ''), widths[i] - 3));
    const maxLines = Math.max(...cellLines.map((l) => Math.max(1, l.length)));
    const currentRowH = Math.max(rowH, maxLines * lineH + 2);
    y = addPdfPageIfNeeded(pdf, y, margin, currentRowH);

    let cellX = margin;
    cellLines.forEach((lines, i) => {
      const textY = y + 3.5;
      lines.forEach((line, idx) => {
        pdf.text(line, cellX + 1.5, textY + idx * lineH);
      });
      cellX += widths[i];
    });

    pdf.setDrawColor(230, 233, 238);
    pdf.line(margin, y + currentRowH, margin + tableW, y + currentRowH);
    y += currentRowH;
  });

  return y + 4;
};

const buildPdfPayload = (report, date, sessions) => {
  const totalsEntries = Object.entries(report?.totals || {}).map(([key, value]) => [toLabel(key), Number(value || 0)]);
  const totalMeals = sessions.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const sessionRows = sessions.map((s) => {
    const count = Number(s.total || 0);
    const pct = totalMeals > 0 ? `${((count / totalMeals) * 100).toFixed(1)}%` : '0.0%';
    return [toLabel(s.session), count, pct];
  });
  const locationRows = sessions.flatMap((s) =>
    (Array.isArray(s.locations) ? s.locations : []).map((loc) => [
      toLabel(s.session),
      toLabel(loc.location || 'Unknown'),
      Number(loc.count || 0)
    ])
  );

  return {
    date,
    generatedAt: new Date().toLocaleString(),
    totalMeals,
    totalSessions: sessions.length,
    totalsEntries,
    sessionRows,
    locationRows,
    textReport: report?.text_report?.trim() || ''
  };
};

const StoreOperatorMealReportPage = () => {
  const { getMealReport } = useKitchenMealReportApi();
  const [date, setDate] = useState(defaultDate);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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
      showStoreSuccess(`Meal report loaded for ${date}.`, 'Report loaded');
    } catch (err) {
      setReport(null);
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load meal report';
      setError(msg);
      showStoreError(msg, 'Could not load report');
    } finally {
      setLoading(false);
    }
  };

  const onDownloadPdf = () => {
    if (!report) return;
    setPdfLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const margin = 14;
      const pageW = pdf.internal.pageSize.getWidth();
      const maxWidth = pageW - margin * 2;
      const payload = buildPdfPayload(report, date, sessions);
      let y = margin;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.text('Daily  Meal Report', margin, y);
      y += 7;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Report date: ${payload.date}`, margin, y);
      y += 5;
      pdf.text(`Generated on: ${payload.generatedAt}`, margin, y);
      y += 9;

      y = drawSectionTitle(pdf, 'Totals', y, margin);
      y = payload.totalsEntries.length
        ? drawSimpleTable(
            pdf,
            [
              { label: 'Session', width: 0.7 },
              { label: 'Value', width: 0.3 }
            ],
            payload.totalsEntries,
            y,
            margin
          )
        : (() => {
            return writeLinesToPdf(pdf, ['No totals returned.'], margin, maxWidth, 5, y) + 3;
          })();

      if (payload.textReport) {
        y = drawSectionTitle(pdf, 'Notes', y, margin);
        y = addPdfPageIfNeeded(pdf, y, margin, 6);
        y = writeLinesToPdf(pdf, payload.textReport.split(/\r?\n/), margin, maxWidth, 5, y);
      }

      pdf.save(`meal-report-${date}.pdf`);
      showStoreSuccess('PDF downloaded.', 'Meal report');
    } catch (err) {
      const msg = err?.message || 'Could not generate PDF';
      showStoreError(msg, 'PDF export failed');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <StorePageShell>
      <StorePageHeader title="Meal Report" />
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
            {report ? (
              <Button type="button" variant="outline" disabled={pdfLoading} onClick={onDownloadPdf}>
                {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
              </Button>
            ) : null}
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
            <StoreSection title="Report">
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
