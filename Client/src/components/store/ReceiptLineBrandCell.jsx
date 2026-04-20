import React, { useEffect, useState } from 'react';

/**
 * Brand name + thumbnail for purchase receipt / manager views.
 * When `brand_id` is set, loads a presigned URL via `getBrandLogoViewUrl` (private S3).
 * Falls back to `brand_logo_s3_url`, then optional catalog item image.
 */
export function ReceiptLineBrandCell({ row = {}, getBrandLogoViewUrl }) {
  const brandId = String(row.brand_id || '').trim();
  const brandName = String(row.brand_name || '').trim();
  const brandLogoS3Url = String(row.brand_logo_s3_url || '').trim();
  const catalogImageUrl = String(row.item_primary_image_url || '').trim();
  const [thumbUrl, setThumbUrl] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    const s3 = brandLogoS3Url;
    const cat = catalogImageUrl;
    if (!brandId || typeof getBrandLogoViewUrl !== 'function') {
      setThumbUrl(s3 || cat);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const { url } = await getBrandLogoViewUrl(brandId);
        const u = String(url || '').trim();
        if (!cancelled) setThumbUrl(u || s3 || cat);
      } catch {
        if (!cancelled) setThumbUrl(s3 || cat);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId, brandLogoS3Url, catalogImageUrl, getBrandLogoViewUrl]);

  const showImg = Boolean((thumbUrl || '').trim() && !imgFailed);
  if (!brandName && !showImg) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  return (
    <div className="flex min-w-0 max-w-[12rem] items-center gap-2">
      {showImg ? (
        <img
          src={thumbUrl}
          alt={brandName ? `${brandName} logo` : ''}
          className="h-7 w-7 shrink-0 rounded-md border border-slate-200 bg-white object-contain"
          onError={() => setImgFailed(true)}
        />
      ) : null}
      <span className="min-w-0 truncate text-sm text-slate-800" title={brandName || undefined}>
        {brandName || '—'}
      </span>
    </div>
  );
}
