import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StoreNotice, StoreSection } from '@/components/store/StorePageShell';

export const CreateBrandSection = ({
  idPrefix = 'create-brand',
  brands = [],
  createBrand,
  uploadBrandLogo
}) => {
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ tone: 'sky', message: '' });

  const inputId = useMemo(
    () => ({
      name: `${idPrefix}-name`,
      logo: `${idPrefix}-logo`
    }),
    [idPrefix]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNotice({ tone: 'amber', message: 'Brand name is required.' });
      return;
    }
    if (typeof createBrand !== 'function') {
      setNotice({ tone: 'rose', message: 'Brand API is unavailable.' });
      return;
    }
    setIsSubmitting(true);
    setNotice({ tone: 'sky', message: '' });
    const created = await createBrand({ name: trimmedName });
    if (!created?.ok) {
      setNotice({ tone: 'rose', message: created?.message || 'Failed to create brand.' });
      setIsSubmitting(false);
      return;
    }
    const createdBrandId = String(created?.data?.id || '');
    if (logoFile && createdBrandId && typeof uploadBrandLogo === 'function') {
      const uploaded = await uploadBrandLogo(createdBrandId, logoFile);
      if (!uploaded?.ok) {
        setNotice({
          tone: 'amber',
          message: `Brand created, but logo upload failed: ${uploaded?.message || 'Unknown error'}`
        });
        setIsSubmitting(false);
        return;
      }
    }
    setNotice({ tone: 'emerald', message: 'Brand created successfully.' });
    setName('');
    setLogoFile(null);
    setIsSubmitting(false);
  };

  return (
    <StoreSection
      title="Create Brand"
      description="Create a brand and optionally upload a logo (JPG, PNG, WEBP)."
      tone="violet"
    >
      {notice.message ? <StoreNotice tone={notice.tone}>{notice.message}</StoreNotice> : null}
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={inputId.name} className="text-sm font-medium">
            Brand Name
          </label>
          <input
            id={inputId.name}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., Fresh Fields"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={inputId.logo} className="text-sm font-medium">
            Logo (optional)
          </label>
          <input
            id={inputId.logo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-sm"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Create Brand'}
          </Button>
        </div>
      </form>

      {brands.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {brands.slice(0, 9).map((brand) => {
            const logoSrc = brand.logo_view_url || '';
            return (
              <div key={brand.id} className="rounded-md border p-2 text-xs">
                <div className="flex items-center gap-2">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={brand.name ? `${brand.name} logo` : ''}
                      className="h-10 w-10 shrink-0 rounded-md border border-slate-200 bg-white object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-md border border-dashed border-slate-200 bg-muted/50" aria-hidden />
                  )}
                  <p className="min-w-0 flex-1 font-medium">{brand.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </StoreSection>
  );
};

