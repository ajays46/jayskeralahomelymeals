import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MaxUiComboBox, MaxUiTextBox } from '@/components/max-ui';
import { StoreNotice, StoreSection } from '@/components/store/StorePageShell';
import api from '../../api/axios';
import { API, readMaxKitchenClientEnvelope } from '../../api/endpoints';
import { kitchenInventoryRequireItemImage } from '../../config/kitchenFeatureFlags.js';
import { fetchInventoryUnitsList } from '../../hooks/adminHook/kitchenStoreHook';
import {
  inferPrimaryUnitTypeFromItemName,
  rankInventoryUnitsForItemName,
  unitInferenceHint
} from '../../utils/inventoryUnitInference.js';

/** @feature kitchen-store — Operator form: create inventory item (`POST .../inventory/items`). */
/** Match `InventoryItemMasterView`: `category` string only (see FRONTEND_INVENTORY_CATEGORY_AND_EXPIRY_UPDATES.md). */
const CAT_NONE = '__none__';
const CAT_OTHER = '__other__';

const initialForm = {
  name: '',
  unit: '',
  /** Free-text when there is no `GET /inventory/categories` list (same as item master “option B”). */
  category: '',
  min_quantity: '',
  /** When categories list is set: catalog row id, `CAT_NONE`, or `CAT_OTHER`. */
  category_pick: CAT_NONE,
  category_custom: ''
};

/** Same rules as item-master save: optional `category` / `category_id` for upstream. */
function buildCategoryCreatePayload(category_pick, category_custom, categories) {
  const list = Array.isArray(categories) ? categories : [];
  if (category_pick === CAT_NONE) {
    return { category: '' };
  }
  if (category_pick === CAT_OTHER) {
    const t = String(category_custom ?? '').trim();
    return t ? { category: t } : { category: '' };
  }
  const row = list.find((c) => c.id === category_pick);
  if (row) {
    return { category_id: row.id, category: row.name };
  }
  if (category_pick && category_pick !== CAT_NONE && category_pick !== CAT_OTHER) {
    return { category_id: category_pick };
  }
  return {};
}

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
  inventoryCategories = null,
  /** Hide inference hints, API-oriented placeholders, and deployment-style notices (e.g. operator item master). */
  suppressFieldHints = false
}) => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ tone: 'sky', message: '' });
  const [primaryFile, setPrimaryFile] = useState(null);
  const [catalogUnits, setCatalogUnits] = useState([]);
  /** Tracks last auto-applied unit so renaming can update the suggestion unless the user diverged. */
  const prevSuggestedUnitRef = useRef('');
  /** When WEIGHT/VOLUME/COUNT inference changes (e.g. rice→egg), always refresh unit — same abbrev can mask that. */
  const prevInferredPrimaryRef = useRef(null);

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
      categoryCustom: `${idPrefix}-category-custom`,
      minQuantity: `${idPrefix}-min-quantity`
    }),
    [idPrefix]
  );

  const unitRanking = useMemo(
    () => rankInventoryUnitsForItemName(form.name, catalogUnits),
    [form.name, catalogUnits]
  );
  const { orderedUnits, suggestedGroup, otherGroup, primaryUnitType } = unitRanking;
  const unitFieldHint = unitInferenceHint(primaryUnitType, form.name);

  useEffect(() => {
    if (!catalogUnits.length) return;
    const primary = inferPrimaryUnitTypeFromItemName(form.name);
    const primaryChanged = prevInferredPrimaryRef.current !== primary;
    prevInferredPrimaryRef.current = primary;
    if (!primary) return;
    const { suggestedAbbrev: next } = rankInventoryUnitsForItemName(form.name, catalogUnits);
    if (!next) return;
    setForm((f) => {
      const cur = f.unit.trim();
      const userOverrodeUnit = cur !== '' && cur !== prevSuggestedUnitRef.current;
      if (userOverrodeUnit && !primaryChanged) return f;
      prevSuggestedUnitRef.current = next;
      return cur === next ? f : { ...f, unit: next };
    });
  }, [form.name, catalogUnits]);

  const onChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetForm = () => {
    prevSuggestedUnitRef.current = '';
    prevInferredPrimaryRef.current = null;
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
      Object.assign(payload, buildCategoryCreatePayload(form.category_pick, form.category_custom, inventoryCategories));
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
          message: suppressFieldHints
            ? 'Choose a primary image (JPEG, PNG, or WebP) before creating the item.'
            : 'Strict image mode is on: choose a primary image (JPEG, PNG, or WebP) before creating the item.'
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
          {suppressFieldHints
            ? 'A primary image is required. Use JPEG, PNG, or WebP.'
            : 'Image is required for this deployment. Choose a JPEG, PNG, or WebP; it is attached immediately after the item is created.'}
        </StoreNotice>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <MaxUiTextBox
          label="Name"
          labelClassName="text-sm font-medium text-slate-800"
          id={inputId.name}
          type="text"
          value={form.name}
          onChange={onChange('name')}
          placeholder="e.g., Basmati Rice"
          required
        />

        {catalogUnits.length > 0 ? (
          <MaxUiComboBox
            label="Unit"
            labelClassName="text-sm font-medium text-slate-800"
            id={inputId.unit}
            value={form.unit}
            onChange={onChange('unit')}
            required
            hint={suppressFieldHints ? undefined : unitFieldHint || undefined}
          >
            <option value="">Select unit…</option>
            {primaryUnitType && otherGroup.length > 0 ? (
              <>
                <optgroup label={suppressFieldHints ? 'Suggested' : `Likely (${primaryUnitType.toLowerCase()})`}>
                  {suggestedGroup.map((u) => (
                    <option key={`${u.id}-${u.abbreviation}`} value={u.abbreviation}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </optgroup>
                <optgroup label={suppressFieldHints ? 'More units' : 'Other units'}>
                  {otherGroup.map((u) => (
                    <option key={`${u.id}-${u.abbreviation}`} value={u.abbreviation}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </optgroup>
              </>
            ) : (
              orderedUnits.map((u) => (
                <option key={`${u.id}-${u.abbreviation}`} value={u.abbreviation}>
                  {u.name} ({u.abbreviation})
                </option>
              ))
            )}
          </MaxUiComboBox>
        ) : (
          <MaxUiTextBox
            label="Unit"
            labelClassName="text-sm font-medium text-slate-800"
            id={inputId.unit}
            type="text"
            value={form.unit}
            onChange={onChange('unit')}
            placeholder={suppressFieldHints ? 'e.g., kg' : 'e.g., kg (load /inventory/units for dropdown)'}
            required
            hint={suppressFieldHints ? undefined : 'Standard units list unavailable; enter abbreviation manually.'}
          />
        )}

        {useCategoryApi ? (
          <div className="min-w-0 space-y-2">
            <MaxUiComboBox
              label="Category"
              labelClassName="text-sm font-medium text-slate-800"
              id={inputId.category}
              value={form.category_pick}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category_pick: e.target.value,
                  category_custom: e.target.value === CAT_OTHER ? f.category_custom : ''
                }))
              }
            >
              <option value={CAT_NONE}>Select category…</option>
              {inventoryCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={CAT_OTHER}>{suppressFieldHints ? 'Other (type name)' : 'Other — type a new name'}</option>
            </MaxUiComboBox>
            {form.category_pick === CAT_OTHER ? (
              <MaxUiTextBox
                label="Category name"
                labelClassName="text-sm font-medium text-slate-800"
                id={inputId.categoryCustom}
                type="text"
                value={form.category_custom}
                onChange={onChange('category_custom')}
                placeholder="e.g., Specialty produce"
                autoComplete="off"
              />
            ) : null}
          </div>
        ) : (
          <MaxUiTextBox
            label="Category"
            labelClassName="text-sm font-medium text-slate-800"
            id={inputId.category}
            type="text"
            value={form.category}
            onChange={onChange('category')}
            placeholder="e.g., Grains"
          />
        )}

        <MaxUiTextBox
          label="Min Quantity"
          labelClassName="text-sm font-medium text-slate-800"
          id={inputId.minQuantity}
          type="number"
          step="any"
          value={form.min_quantity}
          onChange={onChange('min_quantity')}
          placeholder="0"
        />

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
