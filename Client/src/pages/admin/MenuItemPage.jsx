import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSlide from '../../components/AdminSlide';
import { FiArrowLeft, FiPlus, FiSave, FiX, FiEdit } from 'react-icons/fi';
import { useCompanyList, useMenuList, useProductList, useCreateMenuItem, useMenuItemById, useUpdateMenuItem, useCreateMenuItemPrice, useMenuItemPriceList, useMenuItemList, useUpdateMenuItemPrice, useDeleteMenuItemPrice } from '../../hooks/adminHook/adminHook';
import { validateMenuItemForm, validateField, menuItemSchema } from '../../validations/menuItemValidation';
import { validateMenuItemPriceForm, validateField as validateMenuItemPriceField, menuItemPriceSchema } from '../../validations/menuItemPriceValidation';

const MenuItemPage = () => {
  const navigate = useNavigate();
  const { menuItemId } = useParams();
  const isEditMode = !!menuItemId;
  
  // Form states
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    menuId: '',
    productId: '', // Changed from productName to productId
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

  // Edit and Delete states for Menu Item Prices
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [showDeletePriceModal, setShowDeletePriceModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [deletingPrice, setDeletingPrice] = useState(null);
  const [editPriceForm, setEditPriceForm] = useState({
    companyId: '',
    menuItemId: '',
    totalPrice: '',
  });

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
  const { mutate: updateMenuItemPrice, isLoading: isUpdatingPrice, isError: isUpdatePriceError, isSuccess: priceUpdated, error: updatePriceError } = useUpdateMenuItemPrice();
  const { mutate: deleteMenuItemPrice, isLoading: isDeletingPrice, isError: isDeletePriceError, isSuccess: priceDeleted, error: deletePriceError } = useDeleteMenuItemPrice();

  // Extract data from API responses
  const companies = companyListData?.data || [];
  const menus = menuListData?.data || [];
  const products = productListData?.data || [];
  const menuItems = menuItemListData?.data || [];
  const menuItemPrices = menuItemPriceListData?.data || [];

  // Use all products directly
  const filteredProducts = products;

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
             // Debug logging
      
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
        menuId: menuItem.menuId || '',
        productId: menuItem.productId || '', // Load productId
      });

      
    }
  }, [isEditMode, menuItemData, products]);

  // Handle mutation success/error states
  useEffect(() => {
    if (menuItemCreated) {
      setIsLoading(false);
      setIsSuccess(true);
      setMenuItemForm({
        name: '',
        menuId: '',
        productId: '', // Reset productId
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
      setIsLoading(false);
      setIsSuccess(true);
      
      // Show success message
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/jkhm/admin/menu-items-table');
      }, 2000);
    }
  }, [menuItemUpdated, navigate]);

  useEffect(() => {
    if (isError && menuItemError) {
      setIsLoading(false);
      console.error('Menu item creation error:', menuItemError);
      setError(menuItemError.response?.data?.message || menuItemError.message || 'Failed to create menu item');
    }
  }, [isError, menuItemError]);

  useEffect(() => {
    if (isUpdateError && updateError) {
      setIsLoading(false);
      console.error('Menu item update error:', updateError);
      setError(updateError.response?.data?.message || updateError.message || 'Failed to update menu item');
    }
  }, [isUpdateError, updateError]);

  // Menu Item Price success/error handlers
  useEffect(() => {
    if (priceCreated) {
      setIsLoading(false);
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
      setIsLoading(false);
      console.error('Menu item price creation error:', priceError);
      setError(priceError.response?.data?.message || priceError.message || 'Failed to create menu item price');
    }
  }, [isPriceError, priceError]);

  // Menu Item Price Update success/error handlers
  useEffect(() => {
    if (priceUpdated) {
      setIsLoading(false);
      setIsSuccess(true);
      setShowEditPriceModal(false);
      setEditingPrice(null);
      setEditPriceForm({
        companyId: '',
        menuItemId: '',
        totalPrice: '',
      });
      
      // Show success message
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [priceUpdated]);

  useEffect(() => {
    if (isUpdatePriceError && updatePriceError) {
      setIsLoading(false);
      console.error('Menu item price update error:', updatePriceError);
      setError(updatePriceError.response?.data?.message || updatePriceError.message || 'Failed to update menu item price');
    }
  }, [isUpdatePriceError, updatePriceError]);

  // Menu Item Price Delete success/error handlers
  useEffect(() => {
    if (priceDeleted) {
      setIsLoading(false);
      setIsSuccess(true);
      setShowDeletePriceModal(false);
      setDeletingPrice(null);
      
      // Show success message
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [priceDeleted]);

  useEffect(() => {
    if (isDeletePriceError && deletePriceError) {
      setIsLoading(false);
      console.error('Menu item price delete error:', deletePriceError);
      setError(deletePriceError.response?.data?.message || deletePriceError.message || 'Failed to delete menu item price');
    }
  }, [isDeletePriceError, deletePriceError]);

  const resetMenuItemForm = () => {
    setMenuItemForm({
      name: '',
      menuId: '',
      productId: '', // Reset productId
    });
    
    setTouchedFields({});
    setValidationErrors({});
    setError('');
    setIsSuccess(false);
    reset();
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

  // Edit Menu Item Price handlers
  const handleEditPrice = (price) => {
    setEditingPrice(price);
    setEditPriceForm({
      companyId: price.companyId || '',
      menuItemId: price.menuItemId || '',
      totalPrice: price.totalPrice?.toString() || '',
    });
    setShowEditPriceModal(true);
  };

  const handleEditPriceChange = (e) => {
    const { name, value } = e.target;
    setEditPriceForm({ ...editPriceForm, [name]: value });
  };

  const handleEditPriceSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Validate form
      const validation = validateMenuItemPriceForm(editPriceForm);
      if (!validation.isValid) {
        setError('Please fix the validation errors above');
        return;
      }

      // Call the update menu item price API
      updateMenuItemPrice({
        menuItemPriceId: editingPrice.id,
        menuItemPriceData: {
          ...editPriceForm,
          totalPrice: parseInt(editPriceForm.totalPrice) || 0
        }
      });
    } catch (err) {
      console.error('Edit price form submission error:', err);
      setError(err.message || 'Failed to update menu item price');
    }
  };

  // Delete Menu Item Price handlers
  const handleDeletePrice = (price) => {
    setDeletingPrice(price);
    setShowDeletePriceModal(true);
  };

  const confirmDeletePrice = () => {
    if (deletingPrice) {
      deleteMenuItemPrice(deletingPrice.id);
    }
  };

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
                onClick={() => navigate('/jkhm/admin')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Menu Item Management</h1>
            </div>
            {/* <p className="text-gray-400 text-sm sm:text-base">
              Add and manage menu items for your restaurant
            </p> */}
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

                

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Product *
                  </label>
                  <select
                    name="productId"
                    value={menuItemForm.productId}
                    onChange={handleMenuItemChange}
                    onBlur={handleMenuItemBlur}
                    className={getFieldClassName('productId', 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white')}
                    required
                  >
                    <option value="">Select a product</option>
                    {filteredProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.productName} - {product.code} - ₹{product.prices?.[0]?.price || 'N/A'}
                      </option>
                    ))}
                  </select>
                  {getFieldError('productId') && (
                    <p className="mt-1 text-sm text-red-400">{getFieldError('productId')}</p>
                  )}
                  {filteredProducts.length === 0 && (
                    <div className="text-xs text-red-400 mt-1">
                      <p>No products available. Please create products first.</p>
                      <button
                        type="button"
                        onClick={() => window.location.href = '/jkhm/admin/add-product'}
                        className="text-blue-400 hover:text-blue-300 underline mt-1"
                      >
                        Go to Create Product
                      </button>
                    </div>
                  )}
                </div>

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
                                         {menus.map((menu) => {
                       const categoryNames = menu.menuCategories?.map(cat => cat.name).join(', ') || 'No categories';
                       return (
                         <option key={menu.id} value={menu.id}>
                           {menu.name} - {menu.dayOfWeek} - {categoryNames}
                         </option>
                       );
                     })}
                  </select>
                  {getFieldError('menuId') && (
                    <p className="mt-1 text-sm text-red-400">{getFieldError('menuId')}</p>
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
                                             {menuItems.map((menuItem) => {
                       // Find the associated product
                       const product = products.find(p => p.id === menuItem.productId);
                       return (
                         <option key={menuItem.id} value={menuItem.id}>
                           {menuItem.name} - {product ? product.productName : 'No Product'}
                         </option>
                       );
                     })}
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


            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Menu Item Price Modal */}
      {showEditPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Edit Menu Item Price</h3>
                <button
                  onClick={() => setShowEditPriceModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleEditPriceSubmit} className="space-y-4">
                {/* Company Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Company *
                  </label>
                  <select
                    name="companyId"
                    value={editPriceForm.companyId}
                    onChange={handleEditPriceChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Menu Item Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Menu Item *
                  </label>
                  <select
                    name="menuItemId"
                    value={editPriceForm.menuItemId}
                    onChange={handleEditPriceChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                    required
                  >
                    <option value="">Select a menu item</option>
                    {menuItems.map((menuItem) => {
                      const product = products.find(p => p.id === menuItem.productId);
                      return (
                        <option key={menuItem.id} value={menuItem.id}>
                          {menuItem.name} - {product ? product.productName : 'No Product'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Total Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Price *
                  </label>
                  <input
                    type="number"
                    name="totalPrice"
                    value={editPriceForm.totalPrice}
                    onChange={handleEditPriceChange}
                    min="1"
                    max="999999"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                    placeholder="Enter total price"
                    required
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditPriceModal(false)}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPrice}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUpdatingPrice ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        Update Price
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Menu Item Price Confirmation Modal */}
      {showDeletePriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Delete Menu Item Price</h3>
                <button
                  onClick={() => setShowDeletePriceModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Are you sure you want to delete this menu item price?
                </p>
                {deletingPrice && (
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <div className="text-sm text-gray-300 space-y-1">
                      <p><span className="text-gray-500">Price:</span> ₹{deletingPrice.totalPrice}</p>
                      <p><span className="text-gray-500">Company:</span> {deletingPrice.company?.name || 'N/A'}</p>
                      <p><span className="text-gray-500">Menu Item:</span> {deletingPrice.menuItem?.name || 'N/A'}</p>
                    </div>
                  </div>
                )}
                <p className="text-red-400 text-sm mt-3">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeletePriceModal(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePrice}
                  disabled={isDeletingPrice}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeletingPrice ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiX size={16} />
                      Delete Price
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile footer navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminSlide isFooter={true} />
      </div>
    </div>
  );
};

export default MenuItemPage; 