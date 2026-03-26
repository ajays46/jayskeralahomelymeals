import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { getItemService } from './kitchenStore.service.js';
import { logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

const extensionForMime = (mime) => {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
};

const safeFilename = (name) => {
  const base = (name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  return base || 'image';
};

const uploadsRoot = () => path.join(process.cwd(), 'src', 'services', 'uploads');

/**
 * Relative path under `src/services/uploads` (no leading slash), for storage key.
 */
const storageRelativePath = (companyId, inventoryItemId, rowId, contentType) => {
  const ext = extensionForMime(contentType || 'image/jpeg');
  return path.join('inventory-item-images', companyId, inventoryItemId, `${rowId}.${ext}`).replace(/\\/g, '/');
};

/**
 * Public URL path served by Express `/uploads/*`.
 */
const publicUploadsPath = (relativePosix) => `/uploads/${relativePosix}`;

const isTruthyPrimary = (v) => v === true || v === 1 || v === '1' || v === 'true';

/**
 * Preview URL: optional DB fields first; else derive from id + content_type + paths (file saved on disk).
 */
const derivedPublicPathForRow = (r) => {
  if (!r?.id || !r?.companyId || !r?.inventoryItemId) return null;
  const rel = storageRelativePath(r.companyId, r.inventoryItemId, r.id, r.contentType);
  return publicUploadsPath(rel);
};

/**
 * Ensures the kitchen-store item exists for this tenant (proxied GET).
 */
const assertItemExists = async (itemId, companyId, actorUserId = null) => {
  try {
    await getItemService(itemId, companyId, actorUserId);
  } catch (e) {
    if (e instanceof AppError && e.statusCode === 404) {
      throw new AppError('Inventory item not found', 404);
    }
    throw e;
  }
};

const rowToDto = (r) => {
  const imageUrl = r.presignedUrl || r.s3Url || derivedPublicPathForRow(r);
  return {
    id: r.id,
    company_id: r.companyId,
    inventory_item_id: r.inventoryItemId,
    s3_key: r.s3Key,
    s3_url: r.s3Url,
    presigned_url: r.presignedUrl,
    filename: r.filename,
    content_type: r.contentType,
    file_size: r.fileSize != null ? r.fileSize.toString() : null,
    sort_order: r.sortOrder,
    is_primary: r.isPrimary === true,
    uploaded_by: r.uploadedBy,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    image_url: imageUrl
  };
};

export const listInventoryItemImagesService = async (inventoryItemId, companyId) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id is required', 400);
  }
  if (!UUID_RE.test(String(inventoryItemId || ''))) {
    throw new AppError('Invalid item id', 400);
  }

  const rows = await prisma.inventoryItemImage.findMany({
    where: {
      companyId: companyId.trim(),
      inventoryItemId: String(inventoryItemId)
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });

  return rows.map(rowToDto);
};

export const createInventoryItemImageService = async ({
  inventoryItemId,
  companyId,
  file,
  uploadedBy,
  isPrimary = false,
  sortOrder = null
}) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id is required', 400);
  }
  if (!UUID_RE.test(String(inventoryItemId || ''))) {
    throw new AppError('Invalid item id', 400);
  }
  if (!file?.buffer || !file.mimetype) {
    throw new AppError('Image file is required', 400);
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new AppError('Only JPEG, PNG, WebP, or GIF images are allowed', 400);
  }
  if (file.size > MAX_BYTES) {
    throw new AppError('Image must be 5 MB or smaller', 400);
  }

  await assertItemExists(inventoryItemId, companyId, uploadedBy);

  const cid = companyId.trim();
  const iid = String(inventoryItemId);
  const id = randomUUID();
  const relativePosix = storageRelativePath(cid, iid, id, file.mimetype);
  const diskPath = path.join(uploadsRoot(), ...relativePosix.split('/'));
  const fname = safeFilename(file.originalname);
  const primary = isTruthyPrimary(isPrimary);

  let resolvedSort =
    typeof sortOrder === 'number' && Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : null;

  try {
    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, file.buffer);
  } catch (err) {
    logError(LOG_CATEGORIES.INVENTORY, 'Inventory item image local save failed', {
      companyId: cid,
      inventoryItemId: iid,
      message: err.message
    });
    throw new AppError('Failed to save image file', 500);
  }

  const row = await prisma.$transaction(async (tx) => {
    if (primary) {
      await tx.inventoryItemImage.updateMany({
        where: { companyId: cid, inventoryItemId: iid },
        data: { isPrimary: false }
      });
    }

    if (resolvedSort == null) {
      const agg = await tx.inventoryItemImage.aggregate({
        where: { companyId: cid, inventoryItemId: iid },
        _max: { sortOrder: true }
      });
      const max = agg._max.sortOrder;
      resolvedSort = max != null ? max + 1 : 0;
    }

    return tx.inventoryItemImage.create({
      data: {
        id,
        companyId: cid,
        inventoryItemId: iid,
        s3Key: null,
        s3Url: null,
        presignedUrl: null,
        filename: fname.slice(0, 255),
        contentType: file.mimetype.slice(0, 100),
        fileSize: BigInt(file.size),
        sortOrder: resolvedSort,
        isPrimary: primary,
        uploadedBy: uploadedBy ? String(uploadedBy).slice(0, 100) : null
      }
    });
  });

  return rowToDto(row);
};
