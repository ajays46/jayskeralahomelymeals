import React, { useState, useEffect } from 'react';
import { FaPlus, FaImage, FaTag, FaBuilding, FaCalendar, FaCoins, FaBoxes, FaSave, FaTimes, FaList, FaUpload, FaArrowLeft, FaEdit } from 'react-icons/fa';
import AdminSlide from '../../components/AdminSlide';
import { useCreateProduct, useUpdateProduct, useCompanyList, useProductById } from '../../hooks/adminHook/adminHook';
import { Popconfirm, Button, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { validateProductForm, validateField, validateImageFile, productSchema } from '../../validations/productValidation';
import 'antd/dist/reset.css';

/**
 * AddProductPage - Product creation and editing form with validation
 * Handles product CRUD operations with image upload and validation
 * Features: Form validation, image upload, product categories, pricing, inventory management
 */
const AddProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!productId;
  
  // Fetch product data if in edit mode
  const { data: productData, isLoading: productLoading, error: productFetchError } = useProductById(productId);
  const [form, setForm] = useState({
    // Product fields
    productName: '',
    code: '',
    imageUrl: '',
    companyId: '',
    status: 'ACTIVE',
    
    // Category fields
    productCategoryName: '',
    categoryDescription: '',
    
    // Price fields
    price: '',
    priceDate: new Date().toISOString().slice(0, 10),
    
    // Quantity fields
    quantity: '',
    quantityDate: new Date().toISOString().slice(0, 10),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const { mutate: createProduct, isLoading: isCreating, isError, isSuccess: productCreated, error: productError, reset } = useCreateProduct();
  const { mutate: updateProduct, isLoading: isUpdating } = useUpdateProduct();
  const { data: companyListData, isLoading: companiesLoading } = useCompanyList();

  // Extract companies from the response
  const companies = companyListData?.data || [];

  // Populate form when product data loads (edit mode)
  useEffect(() => {
    if (isEditMode && productData?.data) {
      const product = productData.data;
      setForm({
        productName: product.productName || '',
        code: product.code || '',
        imageUrl: product.imageUrl || '',
        companyId: product.companyId || '',
        status: product.status || 'ACTIVE',
        productCategoryName: product.categories?.[0]?.productCategoryName || '',
        categoryDescription: product.categories?.[0]?.description || '',
        price: product.prices?.[0]?.price?.toString() || '',
        priceDate: product.prices?.[0]?.date ? new Date(product.prices[0].date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        quantity: product.quantities?.[0]?.quantity?.toString() || '',
        quantityDate: product.quantities?.[0]?.date ? new Date(product.quantities[0].date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      });
      if (product.imageUrl) {
        setUploadedImage({ name: 'product-image', url: product.imageUrl });
      }
    }
  }, [productData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear success/error messages
    if (isSuccess || error) {
      setIsSuccess(false);
      setError('');
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate field
    const fieldError = validateField(productSchema, name, value);
    setValidationErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const getFieldError = (fieldName) => {
    return touchedFields[fieldName] && validationErrors[fieldName] ? validationErrors[fieldName] : '';
  };

  const getFieldClassName = (fieldName, baseClasses) => {
    const hasError = getFieldError(fieldName);
    return `${baseClasses} ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      try {
        // Validate image file
        const fileErrors = validateImageFile(info.file.originFileObj);
        if (fileErrors.length > 0) {
          fileErrors.forEach(error => message.error(error));
          return;
        }
        
        // Convert file to base64
        const base64String = await convertFileToBase64(info.file.originFileObj);
        const imageUrl = URL.createObjectURL(info.file.originFileObj);
        setForm({ ...form, imageUrl: base64String });
        setUploadedImage(info.file);
        
        // Clear image validation error
        setValidationErrors(prev => ({ ...prev, imageUrl: '' }));
        setTouchedFields(prev => ({ ...prev, imageUrl: true }));
        
        message.success(`${info.file.name} uploaded successfully!`);
      } catch (error) {
        message.error('Failed to process image file');
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} upload failed.`);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    onChange: handleFileUpload,
    beforeUpload: async (file) => {
      try {
        // Convert file to base64 immediately
        const base64String = await convertFileToBase64(file);
        const imageUrl = URL.createObjectURL(file);
        setForm({ ...form, imageUrl: base64String });
        setUploadedImage(file);
        return false; // Prevent automatic upload
      } catch (error) {
        message.error('Failed to process image file');
        return false;
      }
    },
    onDrop(e) {
      
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Mark all fields as touched for validation display
      const allFields = Object.keys(form);
      setTouchedFields(prev => {
        const newTouched = { ...prev };
        allFields.forEach(field => {
          newTouched[field] = true;
        });
        return newTouched;
      });

      // Validate entire form using Zod
      const validation = validateProductForm(form);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        
        // Show first error message
        const firstError = Object.values(validation.errors)[0];
        message.error(firstError);
        return;
      }

      // Create product data
      const productData = {
        productName: form.productName,
        code: form.code,
        imageUrl: form.imageUrl, // This will be base64 string
        companyId: form.companyId,
        status: form.status,
        category: {
          productCategoryName: form.productCategoryName,
          description: form.categoryDescription
        },
        price: [
          {
            date: form.priceDate,
            price: parseFloat(form.price)
          }
        ],
        quantity: [
          {
            date: form.quantityDate,
            quantity: parseInt(form.quantity)
          }
        ]
      };

      // Use React Query mutation based on mode
      if (isEditMode) {
        updateProduct({ productId, productData }, {
          onSuccess: (data) => {
            message.success('Product updated successfully!');
            navigate(`${basePath}/admin/products`);
          },
          onError: (error) => {
            const errorMessage = error?.response?.data?.message || 'Failed to update product';
            setError(errorMessage);
            message.error(errorMessage);
          }
        });
      } else {
        createProduct(productData, {
          onSuccess: (data) => {
            message.success('Product created successfully!');
            // Reset form
            setForm({
              productName: '',
              code: '',
              imageUrl: '',
              companyId: '',
              status: 'ACTIVE',
              productCategoryName: '',
              categoryDescription: '',
              price: '',
              priceDate: new Date().toISOString().slice(0, 10),
              quantity: '',
              quantityDate: new Date().toISOString().slice(0, 10),
            });
            setUploadedImage(null);
          },
          onError: (error) => {
            const errorMessage = error?.response?.data?.message || 'Failed to create product';
            setError(errorMessage);
            message.error(errorMessage);
          }
        });
      }

    } catch (err) {
      setError(err.message);
      message.error(err.message);
    }
  };

  const resetForm = () => {
    setForm({
      productName: '',
      code: '',
      imageUrl: '',
      companyId: '',
      status: 'ACTIVE',
      productCategoryName: '',
      categoryDescription: '',
      price: '',
      priceDate: new Date().toISOString().slice(0, 10),
      quantity: '',
      quantityDate: new Date().toISOString().slice(0, 10),
    });
    setUploadedImage(null);
    setIsSuccess(false);
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar on desktop */}
      <div className="hidden md:block">
        <AdminSlide />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-2 sm:p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  {isEditMode && (
                    <Button
                      onClick={() => navigate(`${basePath}/admin/products`)}
                      className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                      icon={<FaArrowLeft />}
                    >
                      Back
                    </Button>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {isEditMode ? (
                        <FaEdit size={28} className="text-yellow-400 mb-1 drop-shadow" />
                      ) : (
                        <FaPlus size={28} className="text-blue-400 mb-1 drop-shadow" />
                      )}
                      <h2 className="text-lg sm:text-xl font-extrabold text-center tracking-wide">
                        {isEditMode ? 'Edit Product' : 'Add New Product'}
                      </h2>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                      {isEditMode ? 'Update product information and settings' : 'Create a new product with pricing and quantity information'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {productCreated && (
                <div className="mb-4 p-3 bg-green-900 border border-green-500 rounded-lg text-green-400 font-semibold text-center text-sm">
                  Product created successfully!
                </div>
              )}
              {(error || productError || productFetchError) && (
                <div className="mb-4 p-3 bg-red-900 border border-red-500 rounded-lg text-red-400 font-semibold text-center text-sm">
                  {error || productError?.response?.data?.message || productFetchError?.response?.data?.message || 'Failed to process product'}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Information Section */}
                <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base font-bold text-blue-300 flex items-center gap-2 mb-3">
                    <FaTag className="text-blue-400" />
                    Product Information
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Product Name <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        name="productName" 
                        value={form.productName} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        required 
                        className={getFieldClassName('productName', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors")}
                        placeholder="Enter product name"
                        disabled={isCreating || isUpdating || productLoading} 
                      />
                      {getFieldError('productName') && (
                        <p className="text-red-400 text-xs mt-1">{getFieldError('productName')}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Product Code <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        name="code" 
                        value={form.code} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        required 
                        className={getFieldClassName('code', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors")}
                        placeholder="Enter unique product code (e.g., PROD001)"
                        disabled={isCreating || isUpdating || productLoading} 
                      />
                      {getFieldError('code') && (
                        <p className="text-red-400 text-xs mt-1">{getFieldError('code')}</p>
                      )}
                    </div>

                                          <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-300">Company <span className="text-red-400">*</span></label>
                        <select 
                          name="companyId" 
                          value={form.companyId} 
                          onChange={handleChange} 
                          onBlur={handleBlur}
                          className={getFieldClassName('companyId', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors")}
                          disabled={isCreating || isUpdating || productLoading}
                          required
                        >
                          <option value="">
                            {companiesLoading ? 'Loading companies...' : 'Select a company'}
                          </option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        {getFieldError('companyId') && (
                          <p className="text-red-400 text-xs mt-1">{getFieldError('companyId')}</p>
                        )}
                        {companies.length === 0 && !companiesLoading && (
                          <div className="text-xs text-red-400 mt-1">
                            <p>No companies available. Please create a company first.</p>
                            <button
                              type="button"
                              onClick={() => window.location.href = `${basePath}/admin/company-create`}
                              className="text-blue-400 hover:text-blue-300 underline mt-1"
                            >
                              Go to Create Company
                            </button>
                          </div>
                        )}
                      </div>

                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Status</label>
                      <select 
                        name="status" 
                        value={form.status} 
                        onChange={handleChange} 
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        disabled={isCreating || isUpdating || productLoading}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                        <option value="DISCONTINUED">Discontinued</option>
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Product Image <span className="text-gray-500">(Optional)</span></label>
                      {getFieldError('imageUrl') && (
                        <p className="text-red-400 text-xs mb-2">{getFieldError('imageUrl')}</p>
                      )}
                      
                      {/* Image Upload Area */}
                      {!uploadedImage ? (
                        <Upload.Dragger {...uploadProps} disabled={isCreating || isUpdating || productLoading}>
                          <p className="ant-upload-drag-icon">
                            <FaUpload className="text-blue-400 text-3xl" />
                          </p>
                          <p className="ant-upload-text text-gray-300 text-sm font-medium">
                            Click or drag image file to upload
                          </p>
                          <p className="ant-upload-hint text-gray-500 text-xs">
                            Support for JPG, PNG, GIF up to 5MB
                          </p>
                        </Upload.Dragger>
                      ) : (
                        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <img 
                                src={form.imageUrl} 
                                alt="Product preview" 
                                className="w-24 h-24 object-cover rounded-lg border border-gray-600 shadow-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                ✓
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-200 mb-1">
                                {uploadedImage.name || 'Uploaded Image'}
                              </div>
                              <div className="text-xs text-green-400 mb-2">✓ Image uploaded successfully</div>
                              <div className="text-xs text-gray-400">
                                <div>File size: {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB</div>
                                <div>Type: {uploadedImage.type}</div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, imageUrl: '' });
                                  setUploadedImage(null);
                                }}
                                className="text-red-400 hover:text-red-300 text-xs bg-red-900/20 px-2 py-1 rounded"
                                disabled={isCreating || isUpdating || productLoading}
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, imageUrl: '' });
                                  setUploadedImage(null);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-xs bg-blue-900/20 px-2 py-1 rounded"
                                disabled={isCreating || isUpdating || productLoading}
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Final Product Image Preview */}
                      {uploadedImage && (
                        <div className="mt-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-500/30">
                          <div className="text-center mb-3">
                            <h4 className="text-sm font-medium text-blue-300 mb-1">Final Product Image</h4>
                            <p className="text-xs text-gray-400">This image will be used for your product</p>
                          </div>
                          <div className="flex justify-center">
                            <div className="relative group">
                              <img 
                                src={form.imageUrl} 
                                alt="Final product image" 
                                className="w-32 h-32 object-cover rounded-lg border-2 border-blue-500/50 shadow-xl transition-transform group-hover:scale-105"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium">
                                  Product Image
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Information Section */}
                <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base font-bold text-orange-300 flex items-center gap-2 mb-3">
                    <FaList className="text-orange-400" />
                    Category Information
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Category Name <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        name="productCategoryName" 
                        value={form.productCategoryName} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        required 
                        className={getFieldClassName('productCategoryName', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors")}
                        placeholder="Enter category name"
                        disabled={isCreating || isUpdating || productLoading} 
                      />
                      {getFieldError('productCategoryName') && (
                        <p className="text-red-400 text-xs mt-1">{getFieldError('productCategoryName')}</p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Category Description</label>
                      <textarea 
                        name="categoryDescription" 
                        value={form.categoryDescription} 
                        onChange={handleChange} 
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none" 
                        placeholder="Enter category description (optional)"
                        rows="2"
                        disabled={isCreating || isUpdating || productLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Quantity Section - Combined */}
                <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base font-bold text-green-300 flex items-center gap-2 mb-3">
                    <FaCoins className="text-green-400" />
                    Pricing & Quantity
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Price (₹) <span className="text-red-400">*</span></label>
                      <input 
                        type="number" 
                        name="price" 
                        value={form.price} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        required 
                        min="0"
                        step="0.01"
                        className={getFieldClassName('price', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors")}
                        placeholder="e.g. 37.50"
                        disabled={isCreating || isUpdating || productLoading} 
                      />
                      {getFieldError('price') && (
                        <p className="text-red-400 text-xs mt-1">{getFieldError('price')}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Price Date</label>
                      <input 
                        type="date" 
                        name="priceDate" 
                        value={form.priceDate} 
                        onChange={handleChange} 
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                        disabled={isCreating || isUpdating || productLoading}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Quantity <span className="text-red-400">*</span></label>
                      <input 
                        type="number" 
                        name="quantity" 
                        value={form.quantity} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        required 
                        min="0"
                        className={getFieldClassName('quantity', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors")}
                        placeholder="Enter quantity"
                        disabled={isCreating || isUpdating || productLoading} 
                      />
                      {getFieldError('quantity') && (
                        <p className="text-red-400 text-xs mt-1">{getFieldError('quantity')}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Quantity Date</label>
                      <input 
                        type="date" 
                        name="quantityDate" 
                        value={form.quantityDate} 
                        onChange={handleChange} 
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        disabled={isCreating || isUpdating || productLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    type="submit" 
                    className="flex-1 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={isCreating || isUpdating || productLoading}
                    style={{ backgroundColor: isEditMode ? '#ca8a04' : '#2563eb' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = isEditMode ? '#a16207' : '#1d4ed8'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = isEditMode ? '#ca8a04' : '#2563eb'}
                  >
                    <FaSave className="text-sm" />
                    {isCreating || isUpdating ? (isEditMode ? 'Updating Product...' : 'Creating Product...') : (isEditMode ? 'Update Product' : 'Create Product')}
                  </button>
                  
                  {!isEditMode && (
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="flex-1 bg-gray-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isCreating || isUpdating}
                    >
                      <FaTimes className="text-sm" />
                      Reset Form
                    </button>
                  )}
                  
                  {isEditMode && (
                    <button 
                      type="button" 
                      onClick={() => navigate(`${basePath}/admin/products`)}
                      className="flex-1 bg-gray-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isCreating || isUpdating}
                    >
                      <FaArrowLeft className="text-sm" />
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div className="block md:hidden fixed bottom-0 left-0 w-full z-20">
        <AdminSlide isFooter />
      </div>
    </div>
  );
};

export default AddProductPage; 