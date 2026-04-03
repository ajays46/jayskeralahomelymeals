import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StoreNotice, StoreSection } from '@/components/store/StorePageShell';
import api from '../../api/axios';

/** @feature kitchen-store — Operator form: create inventory item (`POST /kitchen-store/v1/items`). */
const initialForm = {
  name: '',
  unit: '',
  category: '',
  current_quantity: '',
  min_quantity: '',
  brand_name: ''
};

const toNumberOrUndefined = (value) => {
  if (value === '' || value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const extractCreatedItem = (responseData) => {
  if (!responseData) return null;
  if (responseData.data && typeof responseData.data === 'object') {
    const upstream = responseData.data;
    if (upstream.data && typeof upstream.data === 'object') return upstream.data;
    return upstream;
  }
  if (typeof responseData === 'object') return responseData;
  return null;
};

export const CreateInventoryItemSection = ({
  idPrefix = 'create-item',
  description = 'Create a new inventory item.',
  onItemCreated,
  selectedItemId,
  reloadItemImages
}) => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ tone: 'sky', message: '' });

  const inputId = useMemo(
    () => ({
      name: `${idPrefix}-name`,
      unit: `${idPrefix}-unit`,
      category: `${idPrefix}-category`,
      currentQuantity: `${idPrefix}-current-quantity`,
      minQuantity: `${idPrefix}-min-quantity`,
      brandName: `${idPrefix}-brand-name`
    }),
    [idPrefix]
  );

  const onChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setNotice({ tone: 'sky', message: '' });

    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      category: form.category.trim(),
      current_quantity: toNumberOrUndefined(form.current_quantity),
      min_quantity: toNumberOrUndefined(form.min_quantity)
    };

    const trimmedBrandName = form.brand_name.trim();
    if (trimmedBrandName) {
      payload.brand_name = trimmedBrandName;
    }

    if (!payload.name || !payload.unit) {
      setNotice({ tone: 'amber', message: 'Name and unit are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const createResponse = await api.post('/kitchen-store/v1/items', payload);
      const createdItem = extractCreatedItem(createResponse?.data);
      const createdItemId = createdItem?.id;

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
      const message = error?.response?.data?.message || error?.message || 'Failed to create inventory item.';
      setNotice({ tone: 'rose', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StoreSection title="Create Inventory Item" description={description} tone="emerald">
      {notice.message ? <StoreNotice tone={notice.tone}>{notice.message}</StoreNotice> : null}

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
          <input
            id={inputId.unit}
            type="text"
            value={form.unit}
            onChange={onChange('unit')}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., kg"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={inputId.category} className="text-sm font-medium">
            Category
          </label>
          <input
            id={inputId.category}
            type="text"
            value={form.category}
            onChange={onChange('category')}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., Grains"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={inputId.currentQuantity} className="text-sm font-medium">
            Current Quantity
          </label>
          <input
            id={inputId.currentQuantity}
            type="number"
            step="any"
            value={form.current_quantity}
            onChange={onChange('current_quantity')}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="0"
          />
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

        <div className="space-y-1">
          <label htmlFor={inputId.brandName} className="text-sm font-medium">
            Brand Name
          </label>
          <input
            id={inputId.brandName}
            type="text"
            value={form.brand_name}
            onChange={onChange('brand_name')}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </Button>
        </div>
      </form>
    </StoreSection>
  );
};
