/**
 * ML Trip Address Service - Create/read addresses for MaXHub Logistics trips (ml_trip_addresses).
 * Map link only is allowed; no pincode/street/city validation when map link is provided.
 */
import prisma from '../../../config/prisma.js';
import AppError from '../../../utils/AppError.js';

/**
 * Create a new ML trip address (pickup or delivery).
 * Accepts map link only; manual fields (street, city, pincode) are optional when map link is present.
 * @param {string} userId - Delivery partner user id
 * @param {object} addressData - { street, housename, city, pincode, geoLocation, googleMapsUrl }
 * @param {string} addressType - "PICKUP" | "DELIVERY"
 * @returns {Promise<object>} Created MlTripAddress
 */
export const createMlTripAddress = async (userId, addressData, addressType) => {
  try {
    const { street, housename, city, pincode, geoLocation, googleMapsUrl } = addressData;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const hasMapLink = !!(googleMapsUrl && String(googleMapsUrl).trim());
    const hasManual = street?.trim() && city?.trim() && (pincode != null && String(pincode).trim() !== '');

    if (!hasMapLink && !hasManual) {
      throw new AppError('Either Google Maps URL or street, city, and pincode are required', 400);
    }

    let normalizedPincode = 0;
    if (hasManual && pincode != null) {
      const pincodeVal = parseInt(String(pincode).trim(), 10);
      if (!Number.isNaN(pincodeVal) && pincodeVal > 0) {
        normalizedPincode = String(pincodeVal).length === 5
          ? parseInt(String(pincodeVal).padStart(6, '0'), 10)
          : pincodeVal;
      }
    }

    const record = await prisma.mlTripAddress.create({
      data: {
        userId,
        street: (street || '').trim(),
        housename: (housename || '').trim(),
        city: (city || '').trim(),
        pincode: normalizedPincode,
        geoLocation: geoLocation?.trim() || null,
        googleMapsUrl: hasMapLink ? String(googleMapsUrl).trim() : null,
        addressType: addressType === 'PICKUP' || addressType === 'DELIVERY' ? addressType : null,
      },
    });
    return record;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Create ML trip address service error:', error);
    throw new AppError('Failed to create trip address', 500);
  }
};

/**
 * Update an existing ML trip address (e.g. delivery address for a trip).
 * @param {string} addressId - MlTripAddress id
 * @param {string} userId - Owner user id (must match address userId)
 * @param {object} addressData - { street?, housename?, city?, pincode?, geoLocation?, googleMapsUrl? }
 * @returns {Promise<object>} Updated MlTripAddress
 */
export const updateMlTripAddress = async (addressId, userId, addressData) => {
  try {
    if (!addressId || !userId) {
      throw new AppError('Address ID and user ID are required', 400);
    }
    const { street, housename, city, pincode, geoLocation, googleMapsUrl } = addressData || {};
    const hasMapLink = !!(googleMapsUrl && String(googleMapsUrl).trim());
    const hasManual = street?.trim() && city?.trim() && (pincode != null && String(pincode).trim() !== '');

    if (!hasMapLink && !hasManual) {
      throw new AppError('Either Google Maps URL or street, city, and pincode are required', 400);
    }

    let normalizedPincode = 0;
    if (pincode != null && String(pincode).trim() !== '') {
      const pincodeVal = parseInt(String(pincode).trim(), 10);
      if (!Number.isNaN(pincodeVal) && pincodeVal > 0) {
        normalizedPincode = String(pincodeVal).length === 5
          ? parseInt(String(pincodeVal).padStart(6, '0'), 10)
          : pincodeVal;
      }
    }

    const existing = await prisma.mlTripAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      throw new AppError('Address not found or access denied', 404);
    }

    const record = await prisma.mlTripAddress.update({
      where: { id: addressId },
      data: {
        street: (street ?? existing.street ?? '').toString().trim() || existing.street,
        housename: (housename ?? existing.housename ?? '').toString().trim() || existing.housename,
        city: (city ?? existing.city ?? '').toString().trim() || existing.city,
        pincode: hasManual ? normalizedPincode : (existing.pincode ?? 0),
        geoLocation: (geoLocation != null && String(geoLocation).trim() !== '') ? String(geoLocation).trim() : existing.geoLocation,
        googleMapsUrl: hasMapLink ? String(googleMapsUrl).trim() : (existing.googleMapsUrl ?? null),
      },
    });
    return record;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Update ML trip address service error:', error);
    throw new AppError('Failed to update trip address', 500);
  }
};
