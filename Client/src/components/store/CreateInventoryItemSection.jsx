import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StoreNotice, StoreSection } from '@/components/store/StorePageShell';
import api from '../../api/axios';
import { API, readMaxKitchenClientEnvelope } from '../../api/endpoints';
import { kitchenInventoryRequireItemImage } from '../../config/kitchenFeatureFlags.js';
import { fetchInventoryUnitsList } from '../../hooks/adminHook/kitchenStoreHook';

/** @feature kitchen-store — Operator form: create inventory item (`POST .../inventory/items`). */
const initialForm = {
  name: '',
  unit: '',
  category: '',
  min_quantity: '',
  /** When `inventoryCategories` is set: '' (none) or category id */
  category_pick: ''
};

const toNumberOrUndefined = (value) => {
  if (value === '' || value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const extractCreatedItem = (axiosResponse) => {
  const responseData = readMaxKitchenClientEnvelope(axiosResponse) ?? axiosResponse?.data;
  if (!responseData) return null;
  if (responseData.data && typeof responseData.data === 'object') {
    const upstream = responseData.data;
    if (upstream.data && typeof upstream.data === 'object') return upstream.data;
    return upstream;
  }
  if (typeof responseData === 'object') return responseData;
  return null;
};

const guessContentType = (file) => {
  if (file?.type) return file.type;
  const n = String(file?.name || '').toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const extMatchesContentType = (filename, contentType) => {
  const f = String(filename || '').toLowerCase();
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('png')) return f.endsWith('.png');
  if (ct.includes('webp')) return f.endsWith('.webp');
  return f.endsWith('.jpg') || f.endsWith('.jpeg');
};

export const CreateInventoryItemSection = ({
  idPrefix = 'create-item',
  description = 'Create a new inventory item.',
  onItemCreated,
  selectedItemId,
  reloadItemImages,
  /** Item Master hides the image block; create payload stays minimal and no post-create image upload. */
  showPrimaryImage = true,
  /** No `StoreSection` chrome — use inside a parent `<details>` or tight layout. */
  embedded = false,
  /** From `GET /inventory/categories`; when non-empty, category is chosen by id (or omit). */
  inventoryCategories = null
}) => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ tone: 'sky', message: '' });
  const [primaryFile, setPrimaryFile] = useState(null);
  const [catalogUnits, setCatalogUnits] = useState([]);

  const strictImage = kitchenInventoryRequireItemImage();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await fetchInventoryUnitsList();
      if (!cancelled) setCatalogUnits(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const inputId = useMemo(
    () => ({
      name: `${idPrefix}-name`,
      unit: `${idPrefix}-unit`,
      category: `${idPrefix}-category`,
      minQuantity: `${idPrefix}-min-quantity`
    }),
    [idPrefix]
  );

  const onChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetForm = () => {
    setForm({ ...initialForm });
    setPrimaryFile(null);
  };

  const useCategoryApi = Array.isArray(inventoryCategories) && inventoryCategories.length > 0;

  const onSubmit = async (event) => {
    event.preventDefault();
    setNotice({ tone: 'sky', message: '' });

    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      min_quantity: toNumberOrUndefined(form.min_quantity)
    };

    if (useCategoryApi) {
      const pick = String(form.category_pick || '').trim();
      if (pick) {
        const row = inventoryCategories.find((x) => x.id === pick);
        if (row) {
          payload.category_id = row.id;
          payload.category = row.name;
        }
      }
    } else {
      const c = form.category.trim();
      if (c) payload.category = c;
    }

    if (!payload.name || !payload.unit) {
      setNotice({ tone: 'amber', message: 'Name and unit are required.' });
      return;
    }

    if (showPrimaryImage && strictImage) {
      if (!primaryFile) {
        setNotice({
          tone: 'amber',
          message: 'Strict image mode is on: choose a primary image (JPEG, PNG, or WebP) before creating the item.'
        });
        return;
      }
      const contentType = guessContentType(primaryFile);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
        setNotice({ tone: 'amber', message: 'Image must be JPEG, PNG, or Webp.' });
        return;
      }
      if (!extMatchesContentType(primaryFile.name, contentType)) {
        setNotice({ tone: 'amber', message: 'Filename extension must match the image type (.jpg, .png, .webp).' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const createResponse = await api.post(`${API.MAX_KITCHEN_INVENTORY}/items`, payload);
      const createdItem = extractCreatedItem(createResponse);
      const createdItemId = createdItem?.id;

      if (showPrimaryImage && primaryFile && createdItemId) {
        const fd = new FormData();
        fd.append('image', primaryFile);
        fd.append('is_primary', 'true');
        await api.post(`${API.MAX_KITCHEN_INVENTORY}/items/${createdItemId}/images`, fd);
      }

      if (typeof onItemCreated === 'function') {
        onItemCreated(
          createdItem
            ? {
                ...createdItem,
                itemId: createdItem.id || createdItem.itemId || null
              }
            : null
        );
      }

      if (typeof reloadItemImages === 'function') {
        if (createdItemId) await reloadItemImages(createdItemId);
        else if (selectedItemId) await reloadItemImages(selectedItemId);
      }

      setNotice({ tone: 'emerald', message: 'Inventory item created successfully.' });
      resetForm();
    } catch (error) {
      const err = error?.response?.data?.error;
      const message =
        (typeof err?.message === 'string' && err.message) ||
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to create inventory item.';
      setNotice({ tone: 'rose', message: typeof message === 'string' ? message : 'Failed to create inventory item.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formBlock = (
    <>
      {notice.message ? <StoreNotice tone={notice.tone}>{notice.message}</StoreNotice> : null}
      {showPrimaryImage && strictImage ? (
        <StoreNotice tone="sky">
          Image is required for this deployment. Choose a JPEG, PNG, or WebP; it is attached immediately after the item is
          created.
        </StoreNotice>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={inputId.name} className="text-sm font-medium">
            Name
          </label>
          <input
            id={inputId.name}
            type="text"
            value={form.name}
            onChange={onChange('name')}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., Basmati Rice"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={inputId.unit} className="text-sm font-medium">
            Unit
          </label>
          {catalogUnits.length > 0 ? (
            <select
              id={inputId.unit}
              value={form.unit}
              onChange={onChange('unit')}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="">Select unit…</option>
              {catalogUnits.map((u) => (
                <option key={u.id || u.abbreviation} value={u.abbreviation}>
                  {u.name} ({u.abbreviation})
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                id={inputId.unit}
                type="text"
                value={form.unit}
                onChange={onChange('unit')}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="e.g., kg (load /inventory/units for dropdown)"
                required
              />
              <p className="text-xs text-slate-500">Standard units list unavailable; enter abbreviation manually.</p>
            </>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor={inputId.category} className="text-sm font-medium">
            Category
          </label>
          {useCategoryApi ? (
            <select
              id={inputId.category}
              value={form.category_pick}
              onChange={onChange('category_pick')}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select category…</option>
              {inventoryCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={inputId.category}
              type="text"
              value={form.category}
              onChange={onChange('category')}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g., Grains"
            />
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor={inputId.minQuantity} className="text-sm font-medium">
            Min Quantity
          </label>
          <input
            id={inputId.minQuantity}
            type="number"
            step="any"
            value={form.min_quantity}
            onChange={onChange('min_quantity')}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="0"
          />
        </div>

        {showPrimaryImage ? (
          <div className="md:col-span-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3">
            <label className="text-sm font-medium text-slate-800" htmlFor={`${idPrefix}-primary-image`}>
              Primary image {strictImage ? '(required)' : '(optional)'}
            </label>
            <input
              id={`${idPrefix}-primary-image`}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700"
            />
          </div>
        ) : null}

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </Button>
        </div>
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-3">
        {description ? <p className="text-xs leading-relaxed text-slate-600">{description}</p> : null}
        {formBlock}
      </div>
    );
  }

  return (
    <StoreSection title="Create Inventory Item" description={description} tone="emerald">
      {formBlock}
    </StoreSection>
  );
};
