// External API configuration
const EXTERNAL_API_BASE_URL = process.env.AI_ROUTE_API_SECOND;
/**
 * Call external API to save address
 * @param {Object} addressData - The address data to send
 * @returns {Promise<Object>} - Response from external API
 */
export const saveAddressToExternalApi = async (addressData) => {
    try {
        // Clean up the data - convert empty strings to null for optional fields
        // and map field names to match external API expectations
        const cleanedData = {
            id: addressData.id,
            user_id: addressData.userId,
            street: addressData.street,
            housename: addressData.housename || null,
            city: addressData.city,
            pincode: addressData.pincode,
            geo_location: addressData.geoLocation || null,
            google_maps_url: addressData.googleMapsUrl || null,
            address_type: addressData.addressType
            // Note: createdAt and updatedAt are ignored by external API
        };
        
        const response = await fetch(`${EXTERNAL_API_BASE_URL}/save-address`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cleanedData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const responseData = await response.json();
        
        return {
            success: true,
            data: responseData
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            status: 'NETWORK_ERROR'
        };
    }
};
