import prisma from '../models/index.js';
import { saveBase64Image } from './imageUpload.service.js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { writeFileSync, unlinkSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';


// Configure FFmpeg paths explicitly for EC2/Ubuntu
// PM2 might not have the same PATH environment, so we set absolute paths
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
ffmpeg.setFfprobePath('/usr/bin/ffprobe');

console.log('[FFMPEG] Configured FFmpeg path: /usr/bin/ffmpeg');
console.log('[FFMPEG] Configured FFprobe path: /usr/bin/ffprobe');

/**
 * 
/**
 * Delivery Executive Service - Handles delivery executive profile and operations
 * Manages delivery executive profiles, location tracking, and delivery operations
 * Features: Profile management, location tracking, image upload, delivery status updates
 */

// Create or update delivery executive profile
export const createOrUpdateDeliveryExecutive = async (userId, data) => {
  try {
    const { imageUrl, location, latitude, longitude } = data;

    // Check if delivery executive profile already exists
    const existingProfile = await prisma.deliveryExecutive.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await prisma.deliveryExecutive.update({
        where: { userId },
        data: {
          imageUrl,
          location,
          latitude,
          longitude,
          updatedAt: new Date()
        }
      });
      return { success: true, data: updatedProfile, message: 'Profile updated successfully' };
    } else {
      // Create new profile
      const newProfile = await prisma.deliveryExecutive.create({
        data: {
          userId,
          imageUrl,
          location,
          latitude,
          longitude
        }
      });
      return { success: true, data: newProfile, message: 'Profile created successfully' };
    }
  } catch (error) {
    console.error('Error in createOrUpdateDeliveryExecutive:', error);
    throw new Error('Failed to create/update delivery executive profile: ' + error.message);
  }
};

// Get delivery executive profile by userId
export const getDeliveryExecutiveProfile = async (userId) => {
  try {
    const profile = await prisma.deliveryExecutive.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            auth: {
              select: {
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      }
    });

    if (!profile) {
      return { success: false, message: 'Profile not found' };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error in getDeliveryExecutiveProfile:', error);
    throw new Error('Failed to get delivery executive profile: ' + error.message);
  }
};

// Upload delivery executive image
export const uploadDeliveryExecutiveImage = async (userId, imageData) => {
  try {
    let imageUrl = null;

    if (imageData) {
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const filename = `delivery-exec-${userId}-${timestamp}-${randomSuffix}.jpg`;

      // Save image to uploads folder
      imageUrl = saveBase64Image(imageData, filename);
    }

    // Update profile with new image
    const updatedProfile = await createOrUpdateDeliveryExecutive(userId, {
      imageUrl,
      location: null,
      latitude: null,
      longitude: null
    });

    return { success: true, data: updatedProfile.data, message: 'Image uploaded successfully' };
  } catch (error) {
    console.error('Error in uploadDeliveryExecutiveImage:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
};

// Update delivery executive location
export const updateDeliveryExecutiveLocation = async (userId, locationData) => {
  try {
    const { location, latitude, longitude, address_id } = locationData;

    // If address_id is provided, update the Address table's geo_location
    if (address_id) {
      if (latitude === undefined || longitude === undefined) {
        throw new Error('Latitude and longitude are required when updating address');
      }

      // Import Prisma to update address
      const prisma = (await import('../config/prisma.js')).default;

      // Update the address geo_location
      const updatedAddress = await prisma.address.update({
        where: { id: address_id },
        data: {
          geoLocation: `${latitude},${longitude}`,
          googleMapsUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
          updatedAt: new Date()
        }
      });

      return { 
        success: true, 
        data: { address: updatedAddress }, 
        message: 'Address geo_location updated successfully' 
      };
    }

    // Original behavior: Update delivery executive profile location
    if (!location || latitude === undefined || longitude === undefined) {
      throw new Error('Location, latitude, and longitude are required');
    }

    // Update profile with new location
    const updatedProfile = await createOrUpdateDeliveryExecutive(userId, {
      imageUrl: null, // Don't change image
      location: JSON.stringify(location),
      latitude,
      longitude
    });

    return { success: true, data: updatedProfile.data, message: 'Location updated successfully' };
  } catch (error) {
    console.error('Error in updateDeliveryExecutiveLocation:', error);
    throw new Error('Failed to update location: ' + error.message);
  }
};

// Get all delivery executives
export const getAllDeliveryExecutives = async () => {
  try {
    const deliveryExecutives = await prisma.deliveryExecutive.findMany({
      include: {
        user: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            auth: {
              select: {
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, data: deliveryExecutives };
  } catch (error) {
    console.error('Error in getAllDeliveryExecutives:', error);
    throw new Error('Failed to get delivery executives: ' + error.message);
  }
};

// Delete delivery executive profile
export const deleteDeliveryExecutiveProfile = async (userId) => {
  try {
    const deletedProfile = await prisma.deliveryExecutive.delete({
      where: { userId }
    });

    return { success: true, data: deletedProfile, message: 'Profile deleted successfully' };
  } catch (error) {
    console.error('Error in deleteDeliveryExecutiveProfile:', error);
    throw new Error('Failed to delete profile: ' + error.message);
  }
};

// Helper function to compress video
const compressVideo = async (inputBuffer, originalName, originalMimetype, maxSizeMB = 10) => {
  return new Promise((resolve, reject) => {
    const tempInputPath = join(tmpdir(), `input_${Date.now()}_${originalName}`);
    const tempOutputPath = join(tmpdir(), `output_${Date.now()}_${originalName.replace(/\.[^.]+$/, '.mp4')}`);
    
    try {
      // Write input buffer to temp file
      writeFileSync(tempInputPath, inputBuffer);
      
      // Get video duration and size info
      ffmpeg.ffprobe(tempInputPath, (err, metadata) => {
        if (err) {
          // If ffprobe fails, try compression anyway
          console.warn('Could not probe video metadata, attempting compression anyway:', err.message);
        }
        
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        const currentSize = inputBuffer.length;
        
        // If video is already small enough, return original
        if (currentSize <= maxSizeBytes) {
          try {
            unlinkSync(tempInputPath);
          } catch (e) {}
          resolve({ buffer: inputBuffer, mimetype: originalMimetype, filename: originalName });
          return;
        }
        
        // Calculate target bitrate based on current size and desired size
        // Bitrate formula: (target_size_in_bytes * 8) / duration_in_seconds
        const duration = metadata?.format?.duration || 10; // Default 10 seconds if unknown
        const targetBitrate = Math.floor((maxSizeBytes * 8) / duration) - 50000; // Leave some margin
        
        // Compress video
        ffmpeg(tempInputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset fast',
            '-crf 28', // Higher CRF = lower quality but smaller file (18-28 is good range)
            `-b:v ${Math.max(targetBitrate, 200000)}`, // Minimum 200kbps
            '-b:a 64k', // Low audio bitrate
            '-movflags +faststart', // Web optimization
            '-vf scale=1280:-2' // Max width 1280px, maintain aspect ratio
          ])
          .on('start', (commandLine) => {
            console.log(`Compressing video: ${commandLine}`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`Video compression progress: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            try {
              const compressedBuffer = readFileSync(tempOutputPath);
              
              // Clean up temp files
              unlinkSync(tempInputPath);
              unlinkSync(tempOutputPath);
              
              console.log(`Video compressed from ${(currentSize / 1024 / 1024).toFixed(2)}MB to ${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
              
              resolve({
                buffer: compressedBuffer,
                mimetype: 'video/mp4',
                filename: originalName.replace(/\.[^.]+$/, '.mp4')
              });
            } catch (error) {
              // Clean up on error
              try {
                unlinkSync(tempInputPath);
                if (existsSync(tempOutputPath)) {
                  unlinkSync(tempOutputPath);
                }
              } catch (e) {}
              reject(error);
            }
          })
          .on('error', (err) => {
            // Clean up on error
            try {
              unlinkSync(tempInputPath);
              if (existsSync(tempOutputPath)) {
                unlinkSync(tempOutputPath);
              }
            } catch (e) {}
            
            console.error('Video compression failed, using original:', err.message);
            // Return original if compression fails
            resolve({ buffer: inputBuffer, mimetype: originalMimetype, filename: originalName });
          })
          .save(tempOutputPath);
      });
    } catch (error) {
      // Clean up on error
      try {
        if (existsSync(tempInputPath)) {
          unlinkSync(tempInputPath);
        }
      } catch (e) {}
      console.error('Video compression error, using original:', error.message);
      resolve({ buffer: inputBuffer, mimetype: originalMimetype, filename: originalName });
    }
  });
};

// Upload delivery photos/videos to external API
export const uploadDeliveryPhotoService = async (files, addressId, session, date) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('At least one image or video file is required');
    }

    if (!addressId) {
      throw new Error('Address ID is required');
    }

    if (!session) {
      throw new Error('Session is required');
    }

    if (!date) {
      throw new Error('Date is required (YYYY-MM-DD format)');
    }

    // Convert session to uppercase (BREAKFAST, LUNCH, DINNER)
    const sessionUpper = session.toUpperCase();

    // Process each file (compress images and videos)
    const MAX_SIZE_FOR_IMAGES = 1.5 * 1024 * 1024; // 1.5MB for images
    const MAX_SIZE_FOR_VIDEOS = 10 * 1024 * 1024; // 10MB for videos
    const processedFiles = [];

    for (const file of files) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      if (!isImage && !isVideo) {
        throw new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`);
      }

      let processedBuffer = file.buffer;
      let processedMimeType = file.mimetype;
      let processedFilename = file.originalname;

      // Compress images if too large
      if (isImage && file.size > MAX_SIZE_FOR_IMAGES) {
        try {
          console.log(`Compressing image ${file.originalname} from ${(file.size / 1024 / 1024).toFixed(2)}MB...`);
          
          let sharpInstance = sharp(file.buffer);
          const metadata = await sharpInstance.metadata();
          
          // Resize if image is very large (max 1920px width)
          if (metadata.width && metadata.width > 1920) {
            sharpInstance = sharpInstance.resize(1920, null, {
              withoutEnlargement: true,
              fit: 'inside'
            });
          }
          
          // Compress based on image type
          if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            processedBuffer = await sharpInstance
              .jpeg({ quality: 85, mozjpeg: true })
              .toBuffer();
            processedMimeType = 'image/jpeg';
            processedFilename = file.originalname.replace(/\.(png|gif|webp)$/i, '.jpg');
          } else if (file.mimetype === 'image/png') {
            processedBuffer = await sharpInstance
              .png({ quality: 85, compressionLevel: 9 })
              .toBuffer();
            processedMimeType = 'image/png';
          } else {
            // For other formats, convert to JPEG
            processedBuffer = await sharpInstance
              .jpeg({ quality: 85, mozjpeg: true })
              .toBuffer();
            processedMimeType = 'image/jpeg';
            processedFilename = file.originalname.replace(/\.[^.]+$/, '.jpg');
          }
          
          // If still too large, reduce quality further
          if (processedBuffer.length > MAX_SIZE_FOR_EXTERNAL_API) {
            console.log(`Image still too large (${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB), reducing quality further...`);
            sharpInstance = sharp(file.buffer);
            
            if (metadata.width && metadata.width > 1280) {
              sharpInstance = sharpInstance.resize(1280, null, {
                withoutEnlargement: true,
                fit: 'inside'
              });
            }
            
            processedBuffer = await sharpInstance
              .jpeg({ quality: 75, mozjpeg: true })
              .toBuffer();
            processedMimeType = 'image/jpeg';
            processedFilename = file.originalname.replace(/\.[^.]+$/, '.jpg');
          }
          
          console.log(`Image compressed to ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        } catch (compressError) {
          console.error('Error compressing image, using original:', compressError);
          // If compression fails, use original
          processedBuffer = file.buffer;
        }
      }
      
      // Compress videos if too large
      if (isVideo && file.size > MAX_SIZE_FOR_VIDEOS) {
        try {
          console.log(`Compressing video ${file.originalname} from ${(file.size / 1024 / 1024).toFixed(2)}MB...`);
          const compressed = await compressVideo(file.buffer, file.originalname, file.mimetype, 10); // Max 10MB
          processedBuffer = compressed.buffer;
          processedMimeType = compressed.mimetype;
          processedFilename = compressed.filename;
          console.log(`Video compressed to ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        } catch (compressError) {
          console.error('Error compressing video, using original:', compressError);
          // If compression fails, use original
          processedBuffer = file.buffer;
        }
      }

      processedFiles.push({
        buffer: processedBuffer,
        mimetype: processedMimeType,
        filename: processedFilename,
        originalName: file.originalname,
        originalSize: file.size,
        processedSize: processedBuffer.length,
        isVideo: isVideo
      });
    }

    // Create FormData for external API
    const formData = new FormData();
    
    // Append all files with 'images[]' key (array format)
    processedFiles.forEach((file) => {
      formData.append('images[]', file.buffer, {
        filename: file.filename,
        contentType: file.mimetype
      });
    });
    
    formData.append('address_id', addressId);
    formData.append('session', sessionUpper);
    formData.append('date', date);

    // Send to external API using fetch (port 5003)
    const externalApiUrl = `${process.env.AI_ROUTE_API_THIRD || 'http://13.203.227.119:5003'}/upload_delivery_pic`;
    
    // Get authorization token from environment variable or use default
    const authToken = process.env.EXTERNAL_API_AUTH_TOKEN || 'mysecretkey123';
    
    // Get FormData headers first, then add Authorization
    const formDataHeaders = formData.getHeaders();
    const headers = {
      ...formDataHeaders,
      'Authorization': `Bearer ${authToken}`
    };
    
    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      // Try to get error details from response body
      let errorDetails = '';
      try {
        const errorText = await response.text();
        errorDetails = errorText;
      } catch (e) {
        // Could not read error response body
      }
      
      // Log authorization errors specifically
      if (response.status === 401 || response.status === 403) {
        console.error('Authorization failed for external API:', {
          status: response.status,
          statusText: response.statusText,
          authHeaderUsed: headers['Authorization'] ? 'Yes' : 'No',
          errorDetails
        });
        throw new Error(`External API authentication failed (${response.status}): ${response.statusText}. Please check EXTERNAL_API_AUTH_TOKEN environment variable.`);
      }
      
      throw new Error(`External API returned ${response.status}: ${response.statusText}. Details: ${errorDetails}`);
    }

    const responseData = await response.json();
    
    if (responseData && responseData.success) {
      return {
        success: true,
        message: `${processedFiles.length} file(s) uploaded successfully to external API`,
        externalResponse: responseData,
        fileInfo: processedFiles.map(f => ({
          originalName: f.originalName,
          originalSize: f.originalSize,
          processedSize: f.processedSize,
          mimeType: f.mimetype,
          isVideo: f.isVideo
        }))
      };
    } else {
      throw new Error('External API returned unsuccessful response');
    }
  } catch (error) {
    console.error('Error in uploadDeliveryPhotoService:', error);
    if (error.message) {
      throw new Error('Failed to upload files: ' + error.message);
    }
    throw new Error('Failed to upload files to external API');
  }
};
