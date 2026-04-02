import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';
import { CreateInventoryItemSection } from '@/components/store/CreateInventoryItemSection';
import api from '../../api/axios';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** API host (same as axios) so `/uploads/...` loads from the Node server, not the Vite dev port. */
const apiOrigin = () => {
  const stripApiSuffix = (value) => String(value || '').replace(/\/$/, '').replace(/\/api$/, '');
  const fromAxios = api.defaults?.baseURL ? stripApiSuffix(api.defaults.baseURL) : '';
  if (fromAxios) return fromAxios;
  const base = import.meta.env.VITE_DEV_API_URL || import.meta.env.VITE_PROD_API_URL || '';
  return stripApiSuffix(base);
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

const ItemBrandCell = ({ item }) => {
  const logoSrc = (item.brand_logo_s3_url || '').trim();
  const brandLabel = (item.brand_name || '').trim();
  if (!brandLabel && !logoSrc) {
    return <span className="text-sm text-slate-400">-</span>;
  }
  return (
    <div className="flex min-w-0 max-w-[14rem] items-center gap-2">
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={brandLabel ? `${brandLabel} logo` : ''}
          className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white object-contain"
        />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-md border border-dashed border-slate-200 bg-slate-50" aria-hidden />
      )}
      <span className="truncate text-sm text-slate-800" title={brandLabel || undefined}>
        {brandLabel || '-'}
      </span>
    </div>
  );
};

const StoreOperatorItemMasterPage = () => {
  const { items, getItemDetail, listItemImages, uploadItemImage } = useKitchenInventoryMock();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [itemDetail, setItemDetail] = useState(null);
  const [itemImages, setItemImages] = useState([]);
  const [status, setStatus] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageFile, setModalImageFile] = useState(null);
  const [imageSubmitting, setImageSubmitting] = useState(false);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      `${it.name} ${it.brand_name || ''} ${it.category} ${it.unit}`.toLowerCase().includes(q)
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

  const onLoadDetail = async (itemId) => {
    setSelectedId(itemId);
    setItemDetail(null);
    setItemImages([]);
    const [detail, imgs] = await Promise.all([getItemDetail(itemId), listItemImages(itemId)]);
    setItemDetail(detail);
    setItemImages(imgs);
  };

  const onSubmitModalImage = async (e) => {
    e.preventDefault();
    if (!selectedId || !modalImageFile) {
      const msg = 'Choose an image file.';
      setStatus(msg);
      showStoreError(msg, 'No file selected');
      return;
    }
    setStatus('');
    setImageSubmitting(true);
    const up = await uploadItemImage(selectedId, modalImageFile);
    setImageSubmitting(false);
    if (up.ok) {
      setStatus('Image uploaded.');
      showStoreSuccess('Image uploaded.', 'Upload complete');
      setImageModalOpen(false);
      await reloadDetailImages(selectedId);
    } else {
      const msg = up.message || 'Upload failed.';
      setStatus(msg);
      showStoreError(msg, 'Upload failed');
    }
  };

  return (
    <StorePageShell>
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <StoreStatGrid>
        <StoreStatCard label="Total Items" value={items.length} tone="violet" />
        <StoreStatCard label="Filtered Items" value={filteredItems.length} tone="sky" />
        <StoreStatCard label="Selected Images" value={itemImages.length} helper={selectedId ? 'For the opened item' : 'Open an item to view images'} tone="amber" />
      </StoreStatGrid>

      <CreateInventoryItemSection
        idPrefix="item-master"
        selectedItemId={selectedId}
        reloadItemImages={reloadDetailImages}
      />

      <StoreSection
        title="Items"
        description="Search and open any item for detail and image management."
        tone="sky"
        headerActions={
          <input
            className="w-full rounded-md border px-3 py-2 text-sm sm:w-72"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item/brand/category/unit"
          />
        }
      >
        {filteredItems.length === 0 ? (
          <StoreNotice tone="amber">No items match the current search.</StoreNotice>
        ) : (
          <div className="max-h-[22rem] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
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
                    <TableCell>
                      <ItemBrandCell item={item} />
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
          </div>
        )}
      </StoreSection>

      <StoreSection
        title="Item Detail"
        description={selectedId ? 'Selected item details and image.' : 'Select an item to load details.'}
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
          <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[220px,1fr]">
              <div className="space-y-1">
                <p className="text-xs font-medium">Featured Image</p>
                <div className="flex h-44 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {featuredImageSrc ? (
                    <img
                      src={featuredImageSrc}
                      alt={featuredImage?.filename || itemDetail.name || 'Item image'}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <p className="p-3 text-center text-xs text-muted-foreground">
                      No image uploaded yet. Use the upload image action to add one.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border p-2 text-xs">
                  <p className="text-xs text-muted-foreground">Item Name</p>
                  <p className="mt-0.5 font-medium">{itemDetail.name}</p>
                </div>
                <div className="rounded-md border p-2 text-xs">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="mt-0.5 font-medium">{itemDetail.category || '-'}</p>
                </div>
                <div className="rounded-md border p-2 text-xs">
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="mt-0.5 font-medium">{itemDetail.unit}</p>
                </div>
                <div className="rounded-md border p-2 text-xs">
                  <p className="text-xs text-muted-foreground">On Hand</p>
                  <p className="mt-0.5 font-medium">{itemDetail.current_quantity}</p>
                </div>
                <div className="rounded-md border p-2 text-xs">
                  <p className="text-xs text-muted-foreground">Minimum Quantity</p>
                  <p className="mt-0.5 font-medium">{itemDetail.min_quantity ?? '-'}</p>
                </div>
              </div>
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

    </StorePageShell>
  );
};

export default StoreOperatorItemMasterPage;
