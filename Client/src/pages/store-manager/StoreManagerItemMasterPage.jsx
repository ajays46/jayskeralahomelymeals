import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  StoreNotice,
  StorePageHeader,
  StorePageShell,
  StoreSection,
  StoreStatCard,
  StoreStatGrid
} from '@/components/store/StorePageShell';
import api from '../../api/axios';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';

/** API host (same as axios) so `/uploads/...` loads from the Node server, not the Vite dev port. */
const apiOrigin = () => {
  const fromAxios = api.defaults?.baseURL ? String(api.defaults.baseURL).replace(/\/$/, '') : '';
  if (fromAxios) return fromAxios;
  const base = import.meta.env.VITE_DEV_API_URL || import.meta.env.VITE_PROD_API_URL || '';
  return String(base).replace(/\/$/, '');
};

const extFromContentType = (ct) => {
  if (!ct) return 'jpg';
  if (String(ct).includes('png')) return 'png';
  if (String(ct).includes('webp')) return 'webp';
  if (String(ct).includes('gif')) return 'gif';
  return 'jpg';
};

/** Matches server disk layout when `image_url` / `s3_url` are empty. */
const derivedUploadsPath = (img) => {
  if (!img?.id || !img?.company_id || !img?.inventory_item_id) return '';
  const ext = extFromContentType(img.content_type);
  return `/uploads/inventory-item-images/${img.company_id}/${img.inventory_item_id}/${img.id}.${ext}`;
};

/** Absolute URL for <img src> (relative `/uploads/...`, absolute `http...`, or API `image_url`). */
const resolveImageSrc = (img) => {
  const raw =
    img?.presigned_url || img?.image_url || img?.s3_url || derivedUploadsPath(img) || '';
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const origin = apiOrigin();
  if (!origin) return raw;
  return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
};

const DETAIL_LABELS = [
  ['id', 'ID'],
  ['company_id', 'Company ID'],
  ['inventory_item_id', 'Inventory item ID'],
  ['s3_key', 'Storage key (optional)'],
  ['s3_url', 'Public path / URL (optional)'],
  ['presigned_url', 'Presigned URL (optional)'],
  ['filename', 'Filename (optional)'],
  ['content_type', 'Content type'],
  ['file_size', 'File size (bytes)'],
  ['sort_order', 'Sort order (optional)'],
  ['is_primary', 'Primary (optional)'],
  ['uploaded_by', 'Uploaded by'],
  ['created_at', 'Created at'],
  ['updated_at', 'Updated at'],
  ['image_url', 'Resolved preview URL']
];

const formatDateTime = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const StoreManagerItemMasterPage = () => {
  const { items, createItem, getItemDetail, listItemImages, uploadItemImage } = useKitchenInventoryMock();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [itemDetail, setItemDetail] = useState(null);
  const [itemImages, setItemImages] = useState([]);
  const [status, setStatus] = useState('');
  const [createImageFile, setCreateImageFile] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageFile, setModalImageFile] = useState(null);
  const [imageSubmitting, setImageSubmitting] = useState(false);
  const [detailImage, setDetailImage] = useState(null);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      `${it.name} ${it.category} ${it.unit}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  /** Primary image, else first image — for the item detail hero preview. */
  const featuredImage = useMemo(() => {
    if (!itemImages.length) return null;
    const primary = itemImages.find((i) => i.is_primary);
    return primary || itemImages[0];
  }, [itemImages]);

  const featuredImageSrc = featuredImage ? resolveImageSrc(featuredImage) : '';

  const reloadDetailImages = async (itemId) => {
    const imgs = await listItemImages(itemId);
    setItemImages(imgs);
  };

  useEffect(() => {
    if (!imageModalOpen) setModalImageFile(null);
  }, [imageModalOpen]);

  const onCreate = async (e) => {
    e.preventDefault();
    setStatus('');
    const payload = {
      name: name.trim(),
      unit: unit.trim(),
      category: category.trim() || null,
      min_quantity: minQuantity === '' ? null : Number(minQuantity)
    };
    const out = await createItem(payload);
    if (out?.ok) {
      let msg = 'Item created successfully.';
      if (createImageFile) {
        if (out.itemId) {
          setImageSubmitting(true);
          const up = await uploadItemImage(out.itemId, createImageFile);
          setImageSubmitting(false);
          if (up.ok) {
            msg = 'Item and image saved.';
            if (selectedId === out.itemId) await reloadDetailImages(out.itemId);
          } else {
            msg = `Item created, but image upload failed: ${up.message}`;
          }
        } else {
          msg =
            'Item created. Could not read the new item id from the API response; add the image from item detail.';
        }
      }
      setStatus(msg);
      setName('');
      setCategory('');
      setMinQuantity('');
      setCreateImageFile(null);
    } else {
      setStatus(out?.message || 'Failed to create item.');
    }
  };

  const onLoadDetail = async (itemId) => {
    setSelectedId(itemId);
    setItemDetail(null);
    setItemImages([]);
    setDetailImage(null);
    const [detail, imgs] = await Promise.all([getItemDetail(itemId), listItemImages(itemId)]);
    setItemDetail(detail);
    setItemImages(imgs);
  };

  const onSubmitModalImage = async (e) => {
    e.preventDefault();
    if (!selectedId || !modalImageFile) {
      setStatus('Choose an image file.');
      return;
    }
    setStatus('');
    setImageSubmitting(true);
    const up = await uploadItemImage(selectedId, modalImageFile);
    setImageSubmitting(false);
    if (up.ok) {
      setStatus('Image uploaded.');
      setImageModalOpen(false);
      await reloadDetailImages(selectedId);
    } else {
      setStatus(up.message || 'Upload failed.');
    }
  };

  const openImageDetail = (img) => {
    const resolved = resolveImageSrc(img);
    setDetailImage({ ...img, image_url: resolved || img.image_url });
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Item Master"
        description="Create inventory items, browse the catalog, and manage uploaded item images."
        tone="violet"
      />

      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <StoreStatGrid>
        <StoreStatCard label="Total Items" value={items.length} tone="violet" />
        <StoreStatCard label="Filtered Items" value={filteredItems.length} tone="sky" />
        <StoreStatCard label="Selected Images" value={itemImages.length} helper={selectedId ? 'For the opened item' : 'Open an item to view images'} tone="amber" />
      </StoreStatGrid>

      <StoreSection title="Create Inventory Item" description="You can optionally upload the first image together with the item." tone="emerald">
        <form onSubmit={onCreate} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              className="rounded-md border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              required
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit"
              required
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              placeholder="Min quantity"
            />
            <Button type="submit" disabled={imageSubmitting}>
              {imageSubmitting ? 'Saving...' : 'Create Item'}
            </Button>
          </div>

          <div className="grid gap-2 rounded-md border p-4 md:max-w-md">
            <p className="text-sm font-medium">Optional first image</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="text-sm"
              onChange={(e) => setCreateImageFile(e.target.files?.[0] || null)}
            />
          </div>
        </form>
      </StoreSection>

      <StoreSection
        title="Items"
        description="Search and open any item for detail and image management."
        tone="sky"
        headerActions={
          <input
            className="w-full rounded-md border px-3 py-2 text-sm sm:w-72"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item/category/unit"
          />
        }
      >
        {filteredItems.length === 0 ? (
          <StoreNotice tone="amber">No items match the current search.</StoreNotice>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Min</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className={selectedId === item.id ? 'bg-muted/40' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {selectedId === item.id ? <Badge variant="secondary">Selected</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.current_quantity}</TableCell>
                  <TableCell>{item.min_quantity ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => onLoadDetail(item.id)}>
                      Open Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StoreSection>

      <StoreSection
        title="Item Detail"
        description={selectedId ? 'Review the selected item and manage its images.' : 'Select an item to load its detail.'}
        tone="violet"
        headerActions={
          selectedId ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setImageModalOpen(true)}>
              Add Image
            </Button>
          ) : null
        }
      >
        {!selectedId ? (
          <StoreNotice tone="amber">Select an item from the table above to load details.</StoreNotice>
        ) : itemDetail ? (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
              <div className="space-y-3">
                <p className="text-sm font-medium">Featured Image</p>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {featuredImageSrc ? (
                    <img
                      src={featuredImageSrc}
                      alt={featuredImage?.filename || itemDetail.name || 'Item image'}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      No image uploaded yet. Use the upload image action to add one.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="mt-1 break-all font-medium">{itemDetail.id}</p>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Item Name</p>
                  <p className="mt-1 font-medium">{itemDetail.name}</p>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="mt-1 font-medium">{itemDetail.category || '-'}</p>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="mt-1 font-medium">{itemDetail.unit}</p>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">On Hand</p>
                  <p className="mt-1 font-medium">{itemDetail.current_quantity}</p>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Minimum Quantity</p>
                  <p className="mt-1 font-medium">{itemDetail.min_quantity ?? '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">All Images</p>
                  <p className="text-xs text-muted-foreground">Click a thumbnail to open full image details.</p>
                </div>
              </div>

              {itemImages.length === 0 ? (
                <StoreNotice tone="amber">No images uploaded for this item.</StoreNotice>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {itemImages.map((img) => {
                    const src = resolveImageSrc(img);
                    return (
                      <button
                        key={img.id}
                        type="button"
                        className="relative overflow-hidden rounded-lg border bg-muted text-left transition hover:border-slate-400"
                        onClick={() => openImageDetail(img)}
                      >
                        <div className="flex h-32 items-center justify-center overflow-hidden">
                          {src ? (
                            <img
                              src={src}
                              alt={img.filename || `Item image ${img.id}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="px-2 text-center text-xs text-muted-foreground">No preview</div>
                          )}
                        </div>
                        <div className="space-y-1 p-3">
                          <p className="truncate text-sm font-medium">{img.filename || 'Untitled image'}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(img.created_at)}</p>
                        </div>
                        {img.is_primary ? (
                          <Badge className="absolute left-2 top-2" variant="default">
                            Primary
                          </Badge>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <StoreNotice tone="sky">Loading detail...</StoreNotice>
        )}
      </StoreSection>

      {imageModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-image-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setImageModalOpen(false);
          }}
        >
          <div className="my-8 w-full max-w-lg rounded-lg border bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 id="item-image-modal-title" className="text-lg font-semibold text-gray-900">
              Upload item image
            </h2>
            <p className="text-sm text-gray-600 mt-1">Item: {itemDetail?.name || selectedId}</p>
            <form onSubmit={onSubmitModalImage} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-800">Image file</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="text-sm w-full mt-1"
                  onChange={(e) => setModalImageFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setImageModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={imageSubmitting}>
                  {imageSubmitting ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailImage ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-detail-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailImage(null);
          }}
        >
          <div className="my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-4">
              <h2 id="image-detail-modal-title" className="text-lg font-semibold text-gray-900">
                Image details
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setDetailImage(null)}>
                Close
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[200px]">
                {resolveImageSrc(detailImage) ? (
                  <img src={resolveImageSrc(detailImage)} alt="" className="max-w-full max-h-80 object-contain" />
                ) : (
                  <p className="text-sm text-gray-500 p-4">No image URL available for preview.</p>
                )}
              </div>
              <dl className="text-sm space-y-2">
                {DETAIL_LABELS.map(([key, label]) => {
                  let val = detailImage[key];
                  if (val === undefined || val === null || val === '') val = '—';
                  else if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
                  else if (key === 'created_at' || key === 'updated_at') {
                    try {
                      val = new Date(val).toLocaleString();
                    } catch {
                      /* keep raw */
                    }
                  }
                  return (
                    <div key={key} className="grid grid-cols-[1fr,1.2fr] gap-2 border-b border-gray-100 pb-2 last:border-0">
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="text-gray-900 break-all">{String(val)}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </StorePageShell>
  );
};

export default StoreManagerItemMasterPage;
