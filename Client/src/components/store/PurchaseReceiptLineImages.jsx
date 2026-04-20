import React, { useEffect, useState } from 'react';

/**
 * Catalog primary image plus optional operator receiving photo (dock evidence).
 * Thumbnails only — no placeholder glyphs; broken URLs show empty frames.
 */
export function PurchaseReceiptLineImages({ catalogUrl, dockUrl, dockUploadedAt, size = 'md' }) {
  const cat = (catalogUrl || '').trim();
  const dock = (dockUrl || '').trim();
  const sizeCls = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const [catFailed, setCatFailed] = useState(false);
  const [dockFailed, setDockFailed] = useState(false);

  useEffect(() => {
    setCatFailed(false);
    setDockFailed(false);
  }, [cat, dock]);

  const dockTitle = dock
    ? dockUploadedAt
      ? `Receiving photo · ${dockUploadedAt}`
      : 'Receiving photo'
    : undefined;

  const showCat = Boolean(cat && !catFailed);
  const showDock = Boolean(dock && !dockFailed);

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-1.5">
      <div
        className={`relative overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${sizeCls}`}
        title={showCat ? 'Catalog image' : 'No catalog image'}
      >
        {showCat ? (
          <img
            src={cat}
            alt=""
            className="h-full w-full object-contain"
            onError={() => setCatFailed(true)}
          />
        ) : (
          <div className="h-full w-full bg-slate-50" aria-hidden />
        )}
      </div>
      {dock ? (
        <div
          className={`relative overflow-hidden rounded-md border border-amber-300/90 bg-amber-50/40 ${sizeCls}`}
          title={dockTitle}
        >
          {showDock ? (
            <img
              src={dock}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setDockFailed(true)}
            />
          ) : (
            <div className="h-full w-full bg-amber-50/40" aria-hidden />
          )}
        </div>
      ) : null}
    </div>
  );
}
