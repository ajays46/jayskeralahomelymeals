import React from 'react';

/**
 * Catalog primary image plus optional operator receiving photo (dock evidence).
 */
export function PurchaseReceiptLineImages({ catalogUrl, dockUrl, dockUploadedAt, size = 'md' }) {
  const cat = (catalogUrl || '').trim();
  const dock = (dockUrl || '').trim();
  const sizeCls = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const dockTitle = dock
    ? dockUploadedAt
      ? `Receiving photo · ${dockUploadedAt}`
      : 'Receiving photo'
    : undefined;

  return (
    <div className="flex min-w-0 shrink-0 items-end gap-1.5">
      <div
        className={`relative overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${sizeCls}`}
        title={cat ? 'Catalog image' : 'No catalog image'}
      >
        {cat ? (
          <img src={cat} alt="" className="h-full w-full object-contain" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[11px] text-slate-400"
            aria-hidden
          >
            —
          </div>
        )}
      </div>
      {dock ? (
        <div className="flex shrink-0 flex-col items-center gap-0.5" title={dockTitle}>
          <div
            className={`relative overflow-hidden rounded-md border border-amber-300/90 bg-amber-50/40 ${sizeCls}`}
          >
            <img src={dock} alt="Receiving evidence" className="h-full w-full object-cover" />
          </div>
          <span className="max-w-[4.5rem] truncate text-[9px] font-semibold uppercase tracking-wide text-amber-900/90">
            Dock
          </span>
        </div>
      ) : null}
    </div>
  );
}
