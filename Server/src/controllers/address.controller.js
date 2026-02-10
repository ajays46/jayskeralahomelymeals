import AppError from '../utils/AppError.js';
import {
    getUserAddressesService,
    createAddressService,
    updateAddressService,
    deleteAddressService,
    getAddressByIdService
} from '../services/address.service.js';
import { saveAddressToExternalApi } from '../utils/externalApi.js';

/**
 * Address Controller - Handles address management API endpoints and operations
 * Manages user addresses, address validation, and address-related operations
 * Features: Address CRUD operations, address validation, external API integration, location management
 */

// Get all addresses for a user
export const getUserAddresses = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const addresses = await getUserAddressesService(userId);

        res.status(200).json({
            success: true,
            message: 'Addresses retrieved successfully',
            data: {
                addresses: addresses
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create a new address
export const createAddress = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const addressData = req.body;
        
        const newAddress = await createAddressService(userId, addressData);

        // Call external API to save address (X-Company-ID required by external API)
        try {
            await saveAddressToExternalApi({
                id: newAddress.id,
                userId: userId,
                street: newAddress.street,
                housename: newAddress.housename,
                city: newAddress.city,
                pincode: newAddress.pincode,
                geoLocation: newAddress.geoLocation,
                googleMapsUrl: newAddress.googleMapsUrl,
                addressType: newAddress.addressType,
                createdAt: newAddress.createdAt,
                updatedAt: newAddress.updatedAt
            }, req.companyId);
        } catch (externalError) {
            // Don't throw error - address was saved successfully in our database
        }

        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            data: {
                address: newAddress
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update an address
export const updateAddress = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const addressId = req.params.id;
        const addressData = req.body;

        const updatedAddress = await updateAddressService(userId, addressId, addressData);

        // Call external API to save address (X-Company-ID required; same endpoint for updates)
        try {
            await saveAddressToExternalApi({
                id: updatedAddress.id,
                userId: userId,
                street: updatedAddress.street,
                housename: updatedAddress.housename,
                city: updatedAddress.city,
                pincode: updatedAddress.pincode,
                geoLocation: updatedAddress.geoLocation,
                googleMapsUrl: updatedAddress.googleMapsUrl,
                addressType: updatedAddress.addressType,
                createdAt: updatedAddress.createdAt,
                updatedAt: updatedAddress.updatedAt
            }, req.companyId);
        } catch (externalError) {
            // Don't throw error - address was updated successfully in our database
        }

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: {
                address: updatedAddress
            }
        });
    } catch (error) {
        next(error);
    }
};

// Delete an address
export const deleteAddress = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const addressId = req.params.id;

        await deleteAddressService(userId, addressId);

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get a specific address
export const getAddressById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const addressId = req.params.id;

        const address = await getAddressByIdService(userId, addressId);

        res.status(200).json({
            success: true,
            message: 'Address retrieved successfully',
            data: {
                address: address
            }
        });
    } catch (error) {
        next(error);
    }
};
