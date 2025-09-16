import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

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

        // Validate required fields
        if (!street || !city || !pincode) {
            throw new AppError('Street, city, and pincode are required', 400);
        }

        // Validate pincode format (6 digits for Indian pincodes)
        if (!/^\d{6}$/.test(pincode.toString())) {
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
                street: street,
                housename: housename || '',
                city: city,
                pincode: parseInt(pincode),
                geoLocation: geoLocation || null,
                googleMapsUrl: googleMapsUrl || null,
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

        // Validate required fields
        if (!street || !city || !pincode) {
            throw new AppError('Street, city, and pincode are required', 400);
        }

        // Validate pincode format
        if (!/^\d{6}$/.test(pincode.toString())) {
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
                street: street,
                housename: housename || '',
                city: city,
                pincode: parseInt(pincode),
                geoLocation: geoLocation || null,
                googleMapsUrl: googleMapsUrl || null,
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