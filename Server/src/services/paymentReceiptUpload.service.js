import fs from 'fs';
import path from 'path';

// Save payment receipt file to payment-receipts folder
export const savePaymentReceipt = (buffer, filename) => {
  try {
    
    
    // Create payment-receipts directory if it doesn't exist
    const receiptsDir = path.join(process.cwd(), 'src', 'services', 'payment-receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    
    // Generate unique filename if not provided
    if (!filename) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      filename = `payment-receipt-${uniqueSuffix}`;
    }
    
    // Save file
    const filePath = path.join(receiptsDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    return filename;
  } catch (error) {
    console.error('Error in savePaymentReceipt:', error);
    throw new Error('Failed to save payment receipt: ' + error.message);
  }
};

// Save base64 payment receipt to payment-receipts folder
export const saveBase64PaymentReceipt = (base64String, filename) => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Create buffer from base64
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create payment-receipts directory if it doesn't exist
    const receiptsDir = path.join(process.cwd(), 'src', 'services', 'payment-receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    
    // Generate unique filename if not provided
    if (!filename) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      filename = `payment-receipt-${uniqueSuffix}.jpg`;
    }
    
    // Save file
    const filePath = path.join(receiptsDir, filename);
    fs.writeFileSync(filePath, buffer);
    
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
      return true;
    } else {
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
