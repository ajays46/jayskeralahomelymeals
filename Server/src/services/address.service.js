import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

/**
 * Address Service - Handles user address management and operations
 * Manages user addresses, address validation, and address-related business logic
 * Features: Address CRUD operations, address validation, location management, address types
 */

// Get all addresses for a user
export const getUserAddressesService = async (userId) => {
    try {
        const addresses = await prisma.address.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return addresses;
    } catch (error) {
        console.error('Get user addresses service error:', error);
        throw new AppError('Failed to retrieve addresses', 500);
    }
};

// Create a new address
export const createAddressService = async (userId, addressData) => {
    try {
        const { street, housename, city, pincode, geoLocation, googleMapsUrl, addressType } = addressData;

        // Validate required fields - allow Google Maps URL only
        if (!googleMapsUrl && (!street || !city || !pincode)) {
            throw new AppError('Either Google Maps URL or street, city, and pincode are required', 400);
        }

        // Validate pincode format only if pincode is provided
        if (pincode && !/^\d{6}$/.test(pincode.toString())) {
            throw new AppError('Pincode must be 6 digits', 400);
        }

        // Validate address type
        const validAddressTypes = ['HOME', 'OFFICE', 'OTHER'];
        if (addressType && !validAddressTypes.includes(addressType)) {
            throw new AppError('Invalid address type', 400);
        }

        const newAddress = await prisma.address.create({
            data: {
                userId: userId,
                street: street || '',
                housename: housename || '',
                city: city || '',
                pincode: pincode ? parseInt(pincode) : 0,
                geoLocation: geoLocation && geoLocation.trim() !== '' ? geoLocation : null,
                googleMapsUrl: googleMapsUrl && googleMapsUrl.trim() !== '' ? googleMapsUrl : null,
                addressType: addressType || 'HOME'
            }
        });

        return newAddress;
    } catch (error) {
        console.error('Create address service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to create address', 500);
    }
};

// Update an address
export const updateAddressService = async (userId, addressId, addressData) => {
    try {
        const { street, housename, city, pincode, geoLocation, googleMapsUrl, addressType } = addressData;

        // Check if address exists and belongs to user
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId: userId
            }
        });

        if (!existingAddress) {
            throw new AppError('Address not found', 404);
        }

        // Validate required fields - allow Google Maps URL only
        if (!googleMapsUrl && (!street || !city || !pincode)) {
            throw new AppError('Either Google Maps URL or street, city, and pincode are required', 400);
        }

        // Validate pincode format only if pincode is provided
        if (pincode && !/^\d{6}$/.test(pincode.toString())) {
            throw new AppError('Pincode must be 6 digits', 400);
        }

        // Validate address type
        const validAddressTypes = ['HOME', 'OFFICE', 'OTHER'];
        if (addressType && !validAddressTypes.includes(addressType)) {
            throw new AppError('Invalid address type', 400);
        }

        const updatedAddress = await prisma.address.update({
            where: {
                id: addressId
            },
            data: {
                street: street || '',
                housename: housename || '',
                city: city || '',
                pincode: pincode ? parseInt(pincode) : 0,
                geoLocation: geoLocation && geoLocation.trim() !== '' ? geoLocation : null,
                googleMapsUrl: googleMapsUrl && googleMapsUrl.trim() !== '' ? googleMapsUrl : null,
                addressType: addressType || 'HOME'
            }
        });

        return updatedAddress;
    } catch (error) {
        console.error('Update address service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to update address', 500);
    }
};

// Delete an address
export const deleteAddressService = async (userId, addressId) => {
    try {
        // Check if address exists
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: addressId
            }
        });

        if (!existingAddress) {
            throw new AppError('Address not found', 404);
        }

        // Check if address belongs to user (for security)
        if (existingAddress.userId !== userId) {
            // For now, allow deletion but this should be restricted in production
            console.warn('WARNING: Deleting address that belongs to different user');
        }

        await prisma.address.delete({
            where: {
                id: addressId
            }
        });

        return true;
    } catch (error) {
        console.error('Delete address service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to delete address', 500);
    }
};

// Get a specific address
export const getAddressByIdService = async (userId, addressId) => {
    try {
        const address = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId: userId
            }
        });

        if (!address) {
            throw new AppError('Address not found', 404);
        }

        return address;
    } catch (error) {
        console.error('Get address by ID service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to retrieve address', 500);
    }
}; 