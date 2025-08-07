import fs from 'fs';
import path from 'path';

// Save payment receipt file to payment-receipts folder
export const savePaymentReceipt = (buffer, filename) => {
  try {
    console.log('Starting to save payment receipt...');
    console.log('Buffer size:', buffer.length);
    
    // Create payment-receipts directory if it doesn't exist
    const receiptsDir = path.join(process.cwd(), 'src', 'services', 'payment-receipts');
    console.log('Payment receipts directory path:', receiptsDir);
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
      console.log('Created payment receipts directory');
    } else {
      console.log('Payment receipts directory already exists');
    }
    
    // Generate unique filename if not provided
    if (!filename) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      filename = `payment-receipt-${uniqueSuffix}`;
    }
    console.log('Filename to save:', filename);
    
    // Save file
    const filePath = path.join(receiptsDir, filename);
    console.log('Full file path:', filePath);
    fs.writeFileSync(filePath, buffer);
    console.log('Payment receipt saved successfully!');
    
    return filename;
  } catch (error) {
    console.error('Error in savePaymentReceipt:', error);
    throw new Error('Failed to save payment receipt: ' + error.message);
  }
};

// Save base64 payment receipt to payment-receipts folder
export const saveBase64PaymentReceipt = (base64String, filename) => {
  try {
    console.log('Starting to save base64 payment receipt...');
    console.log('Base64 string length:', base64String.length);
    
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('Base64 data length after prefix removal:', base64Data.length);
    
    // Create buffer from base64
    const buffer = Buffer.from(base64Data, 'base64');
    console.log('Buffer created, size:', buffer.length);
    
    // Create payment-receipts directory if it doesn't exist
    const receiptsDir = path.join(process.cwd(), 'src', 'services', 'payment-receipts');
    console.log('Payment receipts directory path:', receiptsDir);
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
      console.log('Created payment receipts directory');
    } else {
      console.log('Payment receipts directory already exists');
    }
    
    // Generate unique filename if not provided
    if (!filename) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      filename = `payment-receipt-${uniqueSuffix}.jpg`;
    }
    console.log('Filename to save:', filename);
    
    // Save file
    const filePath = path.join(receiptsDir, filename);
    console.log('Full file path:', filePath);
    fs.writeFileSync(filePath, buffer);
    console.log('Payment receipt saved successfully!');
    
    return filename;
  } catch (error) {
    console.error('Error in saveBase64PaymentReceipt:', error);
    throw new Error('Failed to save base64 payment receipt: ' + error.message);
  }
};

// Delete payment receipt file
export const deletePaymentReceipt = (filename) => {
  try {
    const receiptsDir = path.join(process.cwd(), 'src', 'services', 'payment-receipts');
    const filePath = path.join(receiptsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Payment receipt deleted: ${filename}`);
      return true;
    } else {
      console.log(`Payment receipt not found: ${filename}`);
      return false;
    }
  } catch (error) {
    console.error('Error in deletePaymentReceipt:', error);
    throw new Error('Failed to delete payment receipt: ' + error.message);
  }
};

// Get payment receipt file path
export const getPaymentReceiptPath = (filename) => {
  const receiptsDir = path.join(process.cwd(), 'src', 'services', 'payment-receipts');
  return path.join(receiptsDir, filename);
};

// Check if payment receipt exists
export const paymentReceiptExists = (filename) => {
  const receiptsDir = path.join(process.cwd(), 'src', 'services', 'payment-receipts');
  const filePath = path.join(receiptsDir, filename);
  return fs.existsSync(filePath);
};
