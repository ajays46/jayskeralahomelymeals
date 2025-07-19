import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSlide from '../../components/AdminSlide';
import { FiArrowLeft, FiPlus, FiSave, FiX, FiGrid } from 'react-icons/fi';
import { useCompanyList, useMenuList, useProductList, useCreateMenuItem, useMenuItemList } from '../../hooks/adminHook/adminHook';
import { validateMenuItemForm, validateField, menuItemSchema } from '../../validations/menuItemValidation';

const MenuItemPage = () => {
  const navigate = useNavigate();
  
  // Form states
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    productId: '',
    menuId: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // API hooks
  const { data: companyListData } = useCompanyList();
  const { data: menuListData } = useMenuList();
  const { data: productListData } = useProductList();
  const { data: menuItemListData } = useMenuItemList();
  const { mutate: createMenuItem, isLoading: isCreating, isError, isSuccess: menuItemCreated, error: menuItemError, reset } = useCreateMenuItem();

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

      // Call the create menu item API
      createMenuItem(menuItemForm);

    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to create menu item');
    }
  };

  // Handle mutation success/error states
  useEffect(() => {
    if (menuItemCreated) {
      console.log('Menu item created successfully');
      setIsSuccess(true);
      setMenuItemForm({
        name: '',
        productId: '',
        menuId: '',
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
    if (isError && menuItemError) {
      console.error('Menu item creation error:', menuItemError);
      setError(menuItemError.response?.data?.message || menuItemError.message || 'Failed to create menu item');
    }
  }, [isError, menuItemError]);

  const resetMenuItemForm = () => {
    setMenuItemForm({
      name: '',
      productId: '',
      menuId: '',
    });
    setTouchedFields({});
    setValidationErrors({});
    setError('');
    setIsSuccess(false);
  };

  // Extract data from API responses
  const companies = companyListData?.data || [];
  const menus = menuListData?.data || [];
  const products = productListData?.data || [];
  const menuItems = menuItemListData?.data || [];

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Menu Item Form */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add New Menu Item</h2>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <FiPlus className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Success/Error Messages */}
              {isSuccess && (
                <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Menu item created successfully!</span>
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
                  {getFieldError('productId') && (
                    <p className="mt-1 text-sm text-red-400">{getFieldError('productId')}</p>
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
                    disabled={isLoading || isCreating}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading || isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        Create Menu Item
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Menu Items List */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Menu Items ({menuItems.length})</h3>
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <FiGrid className="w-4 h-4 text-white" />
                </div>
              </div>
              
              {menuItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                    <FiGrid className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No menu items found</h3>
                  <p className="text-gray-400">Create your first menu item using the form on the left.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {menuItems.map((menuItem) => (
                    <div key={menuItem.id} className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-2">{menuItem.name}</h4>
                          <div className="space-y-1 text-sm text-gray-300">
                            <p><span className="font-medium">Product:</span> {menuItem.product?.productName}</p>
                            <p><span className="font-medium">Menu:</span> {menuItem.menu?.name}</p>
                            <p><span className="font-medium">Day:</span> {menuItem.menu?.dayOfWeek}</p>
                            <p><span className="font-medium">Company:</span> {menuItem.menu?.company?.name}</p>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                            Active
                          </span>
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

      {/* Mobile footer navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminSlide isFooter={true} />
      </div>
    </div>
  );
};

export default MenuItemPage; 