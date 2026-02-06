import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MdArrowBack,
  MdUpload,
  MdReceipt,
  MdCheckCircle,
  MdDelete,
  MdVisibility,
  MdCloudUpload,
  MdFileUpload
} from 'react-icons/md';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';
import axiosInstance from '../api/axios.js';
import { useCompanyBasePath } from '../context/TenantContext';
import useAuthStore from '../stores/Zustand.store.js';

const UploadReceiptPage = () => {
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();
  const { paymentId } = useParams();
  const { user } = useAuthStore();
  
  const [payment, setPayment] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await axiosInstance.get(`/payments/${paymentId}`);
      if (response.data.success) {
        setPayment(response.data.data.payment);
      } else {
        showErrorToast('Failed to fetch payment details');
        navigate(`${basePath}/seller/customers`);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      showErrorToast('Failed to fetch payment details');
      navigate(`${basePath}/seller/customers`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('File size must be less than 5MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showErrorToast('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }
    
    setReceiptFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
    
    showSuccessToast('Receipt selected successfully');
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!receiptFile) {
      showErrorToast('Please select a receipt file');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      
      // Add order amount to the form data
      const orderAmount = payment?.paymentAmount || 0;
      formData.append('orderAmount', orderAmount.toString());
      
      const response = await axiosInstance.post(`/payments/${paymentId}/receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Navigate back to customer list with success state
        // Don't show toast here - let CustomersListPage handle it
        navigate(`${basePath}/seller/customers`, {
          state: {
            showReceiptSuccess: true,
            receiptUploaded: true,
            message: 'Payment receipt uploaded successfully!'
          }
        });
      } else {
        showErrorToast(response.data.message || 'Failed to upload receipt');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showErrorToast('Failed to upload receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <MdReceipt className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Not Found</h2>
          <p className="text-gray-600 mb-4">The payment you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(`${basePath}/seller/customers`)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`${basePath}/seller/customers`)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Customers"
              >
                <MdArrowBack className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Upload Payment Receipt</h1>
                <p className="text-sm text-gray-600">Upload receipt for payment #{payment.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MdUpload className="w-5 h-5 text-blue-600" />
                Upload Receipt
              </h2>
              
              {/* File Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-gray-100'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer block">
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      isDragOver ? 'bg-blue-200' : 'bg-blue-100'
                    }`}>
                      <MdCloudUpload className={`text-2xl transition-colors ${
                        isDragOver ? 'text-blue-700' : 'text-blue-600'
                      }`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Payment Receipt</h3>
                    <p className="text-gray-600 mb-4">
                      {isDragOver ? 'Drop your file here' : 'Click here or drag and drop your receipt'}
                    </p>
                    
                    <div className="bg-white rounded-md p-3 border border-gray-200 max-w-sm">
                      <div className="flex items-center justify-center gap-3 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <span className="text-green-600">📷</span>
                          JPG
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-blue-600">🖼️</span>
                          PNG
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-red-600">📄</span>
                          PDF
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Choose File
                      </button>
                    </div>
                  </div>
                </label>
              </div>
              
              {/* Receipt Preview */}
              {receiptFile && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Receipt Preview:</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 transition-colors"
                      >
                        <MdDelete className="w-4 h-4 inline mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  {receiptPreview ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <img 
                        src={receiptPreview} 
                        alt="Receipt preview" 
                        className="max-w-full h-64 object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <MdFileUpload className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">{receiptFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <MdCheckCircle className="w-5 h-5" />
                      <span className="font-medium">Receipt ready for upload</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      File: {receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {receiptFile && (
                <div className="mt-6">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Uploading Receipt...
                      </div>
                    ) : (
                      'Upload Receipt'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Payment Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MdReceipt className="w-5 h-5 text-green-600" />
                Payment Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium text-gray-900">#{payment.id}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-green-600 text-lg">{formatPrice(payment.paymentAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium text-gray-900">{payment.paymentMethod}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.paymentStatus === 'Confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.paymentStatus}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">{formatDate(payment.createdAt)}</span>
                </div>
                
                {payment.paymentDate && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(payment.paymentDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Upload Instructions</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5 font-bold">•</span>
                  <span>Upload a clear photo or scan of your payment receipt</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5 font-bold">•</span>
                  <span>Supported formats: JPG, PNG, PDF</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5 font-bold">•</span>
                  <span>Maximum file size: 5MB</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5 font-bold">•</span>
                  <span>Make sure the receipt shows the payment amount clearly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadReceiptPage;
