import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSlide from '../../components/AdminSlide';
import { FiArrowLeft, FiPlus, FiSave, FiX, FiEdit } from 'react-icons/fi';
import { useCompanyList, useMenuList, useProductList, useCreateMenuItem, useMenuItemById, useUpdateMenuItem, useCreateMenuItemPrice, useMenuItemPriceList, useMenuItemList } from '../../hooks/adminHook/adminHook';
import { validateMenuItemForm, validateField, menuItemSchema } from '../../validations/menuItemValidation';
import { validateMenuItemPriceForm, validateField as validateMenuItemPriceField, menuItemPriceSchema } from '../../validations/menuItemPriceValidation';

const MenuItemPage = () => {
  const navigate = useNavigate();
  const { menuItemId } = useParams();
  const isEditMode = !!menuItemId;
  
  // Form states
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    productId: '',
    menuId: '',
    foodType: 'VEG',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Menu Item Price form states
  const [menuItemPriceForm, setMenuItemPriceForm] = useState({
    companyId: '',
    menuItemId: '',
    totalPrice: '',
  });
  const [menuItemPriceValidationErrors, setMenuItemPriceValidationErrors] = useState({});
  const [menuItemPriceTouchedFields, setMenuItemPriceTouchedFields] = useState({});

  // API hooks
  const { data: companyListData } = useCompanyList();
  const { data: menuListData } = useMenuList();
  const { data: productListData } = useProductList();

  const { data: menuItemData, isLoading: isMenuItemLoading } = useMenuItemById(menuItemId);
  const { mutate: createMenuItem, isLoading: isCreating, isError, isSuccess: menuItemCreated, error: menuItemError, reset } = useCreateMenuItem();
  const { mutate: updateMenuItem, isLoading: isUpdating, isError: isUpdateError, isSuccess: menuItemUpdated, error: updateError, reset: resetUpdate } = useUpdateMenuItem();
  const { mutate: createMenuItemPrice, isLoading: isCreatingPrice, isError: isPriceError, isSuccess: priceCreated, error: priceError } = useCreateMenuItemPrice();
  const { data: menuItemPriceListData, isLoading: menuItemPricesLoading } = useMenuItemPriceList();
  const { data: menuItemListData } = useMenuItemList();

  // Form handlers
  const handleMenuItemChange = (e) => {
    const { name, value } = e.target;
    setMenuItemForm({ ...menuItemForm, [name]: value });
    
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

  const validateFieldLocal = (name, value) => {
    return validateField(menuItemSchema, name, value);
  };

  const handleMenuItemBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate field
    const fieldError = validateFieldLocal(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const getFieldError = (fieldName) => {
    return touchedFields[fieldName] && validationErrors[fieldName] ? validationErrors[fieldName] : '';
  };

  const getFieldClassName = (fieldName, baseClasses) => {
    const hasError = getFieldError(fieldName);
    return `${baseClasses} ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  const handleMenuItemSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Mark all fields as touched for validation display
      const allFields = Object.keys(menuItemForm);
      setTouchedFields(prev => {
        const newTouched = { ...prev };
        allFields.forEach(field => {
          newTouched[field] = true;
        });
        return newTouched;
      });
      // Validate form
      const validation = validateMenuItemForm(menuItemForm);
      if (!validation.success) {
        setValidationErrors(validation.errors);
        setError('Please fix the validation errors above');
        return;
      }
      setIsLoading(true);
      // Call the create or update menu item API
      if (isEditMode) {
        updateMenuItem({ menuItemId, menuItemData: menuItemForm });
      } else {
        createMenuItem(menuItemForm);
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} menu item`);
    }
  };

  // Load menu item data for editing
  useEffect(() => {
    if (isEditMode && menuItemData?.data) {
      const menuItem = menuItemData.data;
      setMenuItemForm({
        name: menuItem.name || '',
        productId: menuItem.productId || '',
        menuId: menuItem.menuId || '',
        foodType: menuItem.foodType || 'VEG',
      });
    }
  }, [isEditMode, menuItemData]);

  // Handle mutation success/error states
  useEffect(() => {
    if (menuItemCreated) {
      
      setIsSuccess(true);
      setMenuItemForm({
        name: '',
        productId: '',
        menuId: '',
        foodType: 'VEG',
      });
      setTouchedFields({});
      setValidationErrors({});
      
      // Show success message
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [menuItemCreated]);

  useEffect(() => {
    if (menuItemUpdated) {
      
      setIsSuccess(true);
      
      // Show success message
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/admin/menu-items-table');
      }, 2000);
    }
  }, [menuItemUpdated, navigate]);

  useEffect(() => {
    if (isError && menuItemError) {
      console.error('Menu item creation error:', menuItemError);
      setError(menuItemError.response?.data?.message || menuItemError.message || 'Failed to create menu item');
    }
  }, [isError, menuItemError]);

  useEffect(() => {
    if (isUpdateError && updateError) {
      console.error('Menu item update error:', updateError);
      setError(updateError.response?.data?.message || updateError.message || 'Failed to update menu item');
    }
  }, [isUpdateError, updateError]);

  // Menu Item Price success/error handlers
  useEffect(() => {
    if (priceCreated) {
      
      setIsSuccess(true);
      setMenuItemPriceForm({
        companyId: '',
        menuItemId: '',
        totalPrice: '',
      });
      setMenuItemPriceTouchedFields({});
      setMenuItemPriceValidationErrors({});
      
      // Show success message
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [priceCreated]);

  useEffect(() => {
    if (isPriceError && priceError) {
      console.error('Menu item price creation error:', priceError);
      setError(priceError.response?.data?.message || priceError.message || 'Failed to create menu item price');
    }
  }, [isPriceError, priceError]);

  const resetMenuItemForm = () => {
    if (isEditMode && menuItemData?.data) {
      const menuItem = menuItemData.data;
      setMenuItemForm({
        name: menuItem.name || '',
        productId: menuItem.productId || '',
        menuId: menuItem.menuId || '',
        foodType: menuItem.foodType || 'VEG',
      });
    } else {
      setMenuItemForm({
        name: '',
        productId: '',
        menuId: '',
        foodType: 'VEG',
      });
    }
    setTouchedFields({});
    setValidationErrors({});
    setError('');
    setIsSuccess(false);
  };

  // Menu Item Price handlers
  const handleMenuItemPriceChange = (e) => {
    const { name, value } = e.target;
    setMenuItemPriceForm({ ...menuItemPriceForm, [name]: value });
    
    // Mark field as touched
    setMenuItemPriceTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Clear validation error for this field
    if (menuItemPriceValidationErrors[name]) {
      setMenuItemPriceValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear success/error messages
    if (isSuccess || error) {
      setIsSuccess(false);
      setError('');
    }
  };

  const validateMenuItemPriceFieldLocal = (name, value) => {
    return validateMenuItemPriceField(menuItemPriceSchema, name, value);
  };

  const handleMenuItemPriceBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setMenuItemPriceTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate field
    const fieldError = validateMenuItemPriceFieldLocal(name, value);
    setMenuItemPriceValidationErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const getMenuItemPriceFieldError = (fieldName) => {
    return menuItemPriceTouchedFields[fieldName] && menuItemPriceValidationErrors[fieldName] ? menuItemPriceValidationErrors[fieldName] : '';
  };

  const getMenuItemPriceFieldClassName = (fieldName, baseClasses) => {
    const hasError = getMenuItemPriceFieldError(fieldName);
    return `${baseClasses} ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  const handleMenuItemPriceSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Mark all fields as touched for validation display
      const allFields = Object.keys(menuItemPriceForm);
      setMenuItemPriceTouchedFields(prev => {
        const newTouched = { ...prev };
        allFields.forEach(field => {
          newTouched[field] = true;
        });
        return newTouched;
      });
      // Validate form
      const validation = validateMenuItemPriceForm(menuItemPriceForm);
      if (!validation.isValid) {
        setMenuItemPriceValidationErrors(validation.errors);
        setError('Please fix the validation errors above');
        return;
      }
      setIsLoading(true);
      // Call the create menu item price API
      createMenuItemPrice({
        ...menuItemPriceForm,
        totalPrice: parseInt(menuItemPriceForm.totalPrice) || 0
      });
    } catch (err) {
      console.error('Menu item price form submission error:', err);
      setError(err.message || 'Failed to create menu item price');
    }
  };

  const resetMenuItemPriceForm = () => {
    setMenuItemPriceForm({
      companyId: '',
      menuItemId: '',
      totalPrice: '',
    });
    setMenuItemPriceTouchedFields({});
    setMenuItemPriceValidationErrors({});
    setError('');
    setIsSuccess(false);
  };

  // Extract data from API responses
  const companies = companyListData?.data || [];
  const menus = menuListData?.data || [];
  const products = productListData?.data || [];
  const menuItems = menuItemListData?.data || [];
  const menuItemPrices = menuItemPriceListData?.data || [];

  // Show loading state when fetching menu item data for editing
  if (isEditMode && isMenuItemLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="hidden md:block">
          <AdminSlide />
        </div>
        <div className="md:ml-14 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading menu item data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSlide />
      </div>

      {/* Main content */}
      <div className="md:ml-14 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Menu Item Management</h1>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              Add and manage menu items for your restaurant
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Add Menu Item Form */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                          <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                {isEditMode ? <FiEdit className="w-4 h-4 text-white" /> : <FiPlus className="w-4 h-4 text-white" />}
              </div>
            </div>

              {/* Success/Error Messages */}
              {isSuccess && (
                <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">
                      Menu item {isEditMode ? 'updated' : 'created'} successfully!
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="font-medium">Error: {error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleMenuItemSubmit} className="space-y-6">
                {/* Menu Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Menu Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={menuItemForm.name}
                    onChange={handleMenuItemChange}
                    onBlur={handleMenuItemBlur}
                    className={getFieldClassName('name', 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400')}
                    placeholder="Enter menu item name"
                  />
                  {getFieldError('name') && (
                    <p className="mt-1 text-sm text-red-400">{getFieldError('name')}</p>
                  )}
                </div>

                {/* Menu Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Menu *
                  </label>
                  <select
                    name="menuId"
                    value={menuItemForm.menuId}
                    onChange={handleMenuItemChange}
                    onBlur={handleMenuItemBlur}
                    className={getFieldClassName('menuId', 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white')}
                  >
                    <option value="">Select a menu</option>
                    {menus.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name} - {menu.dayOfWeek}
                      </option>
                    ))}
                  </select>
                  {getFieldError('menuId') && (
                    <p className="mt-1 text-sm text-red-400">{getFieldError('menuId')}</p>
                  )}
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Product *
                  </label>
                  <div className="relative">
                    <select
                      name="productId"
                      value={menuItemForm.productId}
                      onChange={handleMenuItemChange}
                      onBlur={handleMenuItemBlur}
                      className={getFieldClassName('productId', 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white')}
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.productName} - {product.code}
                        </option>
                      ))}
                    </select>
                    
                    {/* Selected Product Image Preview */}
                    {menuItemForm.productId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {(() => {
                          const selectedProduct = products.find(p => p.id === menuItemForm.productId);
                          return selectedProduct?.imageUrl ? (
                            <img 
                              src={selectedProduct.imageUrl} 
                              alt={selectedProduct.productName}
                              className="w-8 h-8 rounded object-cover border border-gray-500"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-600 border border-gray-500 flex items-center justify-center">
                              <span className="text-xs text-gray-400">No img</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  
                  {/* Product Image Preview Below */}
                  {menuItemForm.productId && (
                    <div className="mt-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
                      {(() => {
                        const selectedProduct = products.find(p => p.id === menuItemForm.productId);
                        return selectedProduct ? (
                          <div className="flex items-center gap-3">
                            <img 
                              src={selectedProduct.imageUrl} 
                              alt={selectedProduct.productName}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-500"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="flex-1">
                              <h4 className="text-white font-medium">{selectedProduct.productName}</h4>
                              <p className="text-gray-400 text-sm">Code: {selectedProduct.code}</p>
                              {selectedProduct.categories?.[0] && (
                                <p className="text-gray-400 text-sm">Category: {selectedProduct.categories[0].productCategoryName}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-gray-600 border border-gray-500 flex items-center justify-center">
                              <span className="text-sm text-gray-400">No image</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-400 text-sm">Product not found</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  {getFieldError('productId') && (
                    <p className="mt-1 text-sm text-red-400">{getFieldError('productId')}</p>
                  )}
                </div>

                {/* Food Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Food Type *
                  </label>
                  <select
                    name="foodType"
                    value={menuItemForm.foodType}
                    onChange={handleMenuItemChange}
                    onBlur={handleMenuItemBlur}
                    className={getFieldClassName('foodType', 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white')}
                  >
                    <option value="VEG">Vegetarian</option>
                    <option value="NON_VEG">Non-Vegetarian</option>
                  </select>
                  {getFieldError('foodType') && (
                    <p className="mt-1 text-sm text-red-400">{getFieldError('foodType')}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={resetMenuItemForm}
                    className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isCreating || isUpdating || isMenuItemLoading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading || isCreating || isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isEditMode ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        {isEditMode ? 'Update Menu Item' : 'Create Menu Item'}
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Menu Item Price Form */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Add Menu Item Price
                  </h2>
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <FiPlus className="w-4 h-4 text-white" />
                  </div>
                </div>

                <form onSubmit={handleMenuItemPriceSubmit} className="space-y-6">
                  {/* Company Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Company *
                    </label>
                    <select
                      name="companyId"
                      value={menuItemPriceForm.companyId}
                      onChange={handleMenuItemPriceChange}
                      onBlur={handleMenuItemPriceBlur}
                      className={getMenuItemPriceFieldClassName('companyId', 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white')}
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    {getMenuItemPriceFieldError('companyId') && (
                      <p className="mt-1 text-sm text-red-400">{getMenuItemPriceFieldError('companyId')}</p>
                    )}
                  </div>

                  {/* Menu Item Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Menu Item *
                    </label>
                    <select
                      name="menuItemId"
                      value={menuItemPriceForm.menuItemId}
                      onChange={handleMenuItemPriceChange}
                      onBlur={handleMenuItemPriceBlur}
                      className={getMenuItemPriceFieldClassName('menuItemId', 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white')}
                    >
                      <option value="">Select a menu item</option>
                      {menuItems.map((menuItem) => (
                        <option key={menuItem.id} value={menuItem.id}>
                          {menuItem.name} - {menuItem.product?.productName}
                        </option>
                      ))}
                    </select>
                    {getMenuItemPriceFieldError('menuItemId') && (
                      <p className="mt-1 text-sm text-red-400">{getMenuItemPriceFieldError('menuItemId')}</p>
                    )}
                    {menuItems.length === 0 && (
                      <div className="text-xs text-red-400 mt-1">
                        <p>No menu items available. Please create a menu item first.</p>
                      </div>
                    )}
                  </div>

                  {/* Total Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total Price *
                    </label>
                    <input
                      type="number"
                      name="totalPrice"
                      value={menuItemPriceForm.totalPrice}
                      onChange={handleMenuItemPriceChange}
                      onBlur={handleMenuItemPriceBlur}
                      min="1"
                      max="999999"
                      className={getMenuItemPriceFieldClassName('totalPrice', 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400')}
                      placeholder="Enter total price"
                    />
                    {getMenuItemPriceFieldError('totalPrice') && (
                      <p className="mt-1 text-sm text-red-400">{getMenuItemPriceFieldError('totalPrice')}</p>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetMenuItemPriceForm}
                      className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || isCreatingPrice}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading || isCreatingPrice ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Price...
                        </>
                      ) : (
                        <>
                          <FiSave size={16} />
                          Create Menu Item Price
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Menu Item Prices List */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
                <h3 className="text-lg font-bold text-green-300 mb-4">
                  Existing Menu Item Prices
                </h3>
                {menuItemPricesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                    <p className="text-gray-400 text-sm mt-2">Loading menu item prices...</p>
                  </div>
                ) : menuItemPrices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-gray-400 text-lg">₹</span>
                    </div>
                    <p className="text-gray-400 text-sm">No menu item prices created yet</p>
                    <p className="text-gray-500 text-xs mt-1">Create your first menu item price using the form above</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {menuItemPrices.map((price) => (
                      <div key={price.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm mb-1">
                              ₹{price.totalPrice}
                            </h4>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p><span className="text-gray-500">Company:</span> {price.company?.name || 'N/A'}</p>
                              <p><span className="text-gray-500">Menu Item:</span> {price.menuItem?.name || 'N/A'}</p>
                              <p><span className="text-gray-500">Product:</span> {price.menuItem?.product?.productName || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 ml-2">
                            {new Date(price.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile footer navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminSlide isFooter={true} />
      </div>
    </div>
  );
};

export default MenuItemPage; 