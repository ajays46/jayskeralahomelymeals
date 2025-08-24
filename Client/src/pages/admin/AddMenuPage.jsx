import React, { useState, useEffect } from 'react';
import { FaPlus, FaUtensils, FaBuilding, FaCalendar, FaSave, FaTimes, FaArrowLeft, FaList, FaTags, FaEdit, FaTrash } from 'react-icons/fa';
import AdminSlide from '../../components/AdminSlide';
import { useCompanyList, useCreateMenu, useMenuList, useCreateMenuCategory, useMenuCategoryList, useUpdateMenu, useDeleteMenu, useUpdateMenuCategory, useDeleteMenuCategory } from '../../hooks/adminHook/adminHook';
import { useNavigate } from 'react-router-dom';
import { validateMenuForm, validateField, menuSchema } from '../../validations/menuValidation';
import { validateMenuCategoryForm, validateField as validateMenuCategoryField, menuCategorySchema } from '../../validations/menuCategoryValidation';
import 'antd/dist/reset.css';

const AddMenuPage = () => {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: '',
    companyId: '',
    status: 'ACTIVE',
  });

  // Menu Category form state
  const [menuCategoryForm, setMenuCategoryForm] = useState({
    name: '',
    description: '',
    companyId: '',
    menuId: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  
  // Menu Category validation states
  const [menuCategoryValidationErrors, setMenuCategoryValidationErrors] = useState({});
  const [menuCategoryTouchedFields, setMenuCategoryTouchedFields] = useState({});

  // Edit modal states
  const [showEditMenuModal, setShowEditMenuModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editMenuForm, setEditMenuForm] = useState({
    name: '',
    companyId: '',
    status: 'ACTIVE',
  });
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    description: '',
    companyId: '',
    menuId: '',
  });

  // Delete confirmation states
  const [showDeleteMenuModal, setShowDeleteMenuModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [deletingMenu, setDeletingMenu] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const { data: companyListData, isLoading: companiesLoading } = useCompanyList();
  const { mutate: createMenu, isLoading: isCreating, isError, isSuccess: menuCreated, error: menuError, reset } = useCreateMenu();
  const { data: menuListData, isLoading: menusLoading } = useMenuList();
  const { mutate: createMenuCategory, isLoading: isCreatingCategory, isError: isCategoryError, isSuccess: categoryCreated, error: categoryError } = useCreateMenuCategory();
  const { data: menuCategoryListData, isLoading: menuCategoriesLoading } = useMenuCategoryList();
  
  // Update and Delete hooks
  const { mutate: updateMenu, isLoading: isUpdatingMenu, isError: isUpdateMenuError, isSuccess: menuUpdated, error: updateMenuError } = useUpdateMenu();
  const { mutate: deleteMenu, isLoading: isDeletingMenu, isError: isDeleteMenuError, isSuccess: menuDeleted, error: deleteMenuError } = useDeleteMenu();
  const { mutate: updateMenuCategory, isLoading: isUpdatingCategory, isError: isUpdateCategoryError, isSuccess: categoryUpdated, error: updateCategoryError } = useUpdateMenuCategory();
  const { mutate: deleteMenuCategory, isLoading: isDeletingCategory, isError: isDeleteCategoryError, isSuccess: categoryDeleted, error: deleteCategoryError } = useDeleteMenuCategory();

  // Handle mutation success/error states
  useEffect(() => {
    if (menuCreated) {
      setIsLoading(false);
      setIsSuccess(true);
      setForm({
        name: '',
        companyId: '',
        status: 'ACTIVE',
      });
      setTouchedFields({});
      setValidationErrors({});
      
      // Show success message and navigate
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/jkhm/admin');
      }, 2000);
    }
  }, [menuCreated, navigate]);

  useEffect(() => {
    if (isError && menuError) {
      setIsLoading(false);
      console.error('Menu creation error:', menuError);
      setError(menuError.response?.data?.message || menuError.message || 'Failed to create menu');
    }
  }, [isError, menuError]);

  // Handle menu category success/error states
  useEffect(() => {
    if (categoryCreated) {
      setIsLoading(false);
      setIsSuccess(true);
      setMenuCategoryForm({
        name: '',
        description: '',
        companyId: '',
        menuId: '',
      });
      setMenuCategoryTouchedFields({});
      setMenuCategoryValidationErrors({});
      
      // Show success message
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [categoryCreated]);

  useEffect(() => {
    if (isCategoryError && categoryError) {
      setIsLoading(false);
      console.error('Menu category creation error:', categoryError);
      setError(categoryError.response?.data?.message || categoryError.message || 'Failed to create menu category');
    }
  }, [isCategoryError, categoryError]);

  // Handle menu update success/error states
  useEffect(() => {
    if (menuUpdated) {
      setIsLoading(false);
      setIsSuccess(true);
      setShowEditMenuModal(false);
      setEditingMenu(null);
      setEditMenuForm({
        name: '',
        companyId: '',
        status: 'ACTIVE',
      });
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [menuUpdated]);

  useEffect(() => {
    if (isUpdateMenuError && updateMenuError) {
      setIsLoading(false);
      console.error('Menu update error:', updateMenuError);
      setError(updateMenuError.response?.data?.message || updateMenuError.message || 'Failed to update menu');
    }
  }, [isUpdateMenuError, updateMenuError]);

  // Handle menu delete success/error states
  useEffect(() => {
    if (menuDeleted) {
      setIsLoading(false);
      setIsSuccess(true);
      setShowDeleteMenuModal(false);
      setDeletingMenu(null);
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [menuDeleted]);

  useEffect(() => {
    if (isDeleteMenuError && deleteMenuError) {
      setIsLoading(false);
      console.error('Menu delete error:', deleteMenuError);
      setError(deleteMenuError.response?.data?.message || deleteMenuError.message || 'Failed to delete menu');
    }
  }, [isDeleteMenuError, deleteMenuError]);

  // Handle category update success/error states
  useEffect(() => {
    if (categoryUpdated) {
      setIsLoading(false);
      setIsSuccess(true);
      setShowEditCategoryModal(false);
      setEditingCategory(null);
      setEditCategoryForm({
        name: '',
        description: '',
        companyId: '',
        menuId: '',
      });
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [categoryUpdated]);

  useEffect(() => {
    if (isUpdateCategoryError && updateCategoryError) {
      setIsLoading(false);
      console.error('Menu category update error:', updateCategoryError);
      setError(updateCategoryError.response?.data?.message || updateCategoryError.message || 'Failed to update menu category');
    }
  }, [isUpdateCategoryError, updateCategoryError]);

  // Handle category delete success/error states
  useEffect(() => {
    if (categoryDeleted) {
      setIsLoading(false);
      setIsSuccess(true);
      setShowDeleteCategoryModal(false);
      setDeletingCategory(null);
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }
  }, [categoryDeleted]);

  useEffect(() => {
    if (isDeleteCategoryError && deleteCategoryError) {
      setIsLoading(false);
      console.error('Menu category delete error:', deleteCategoryError);
      setError(deleteCategoryError.response?.data?.message || deleteCategoryError.message || 'Failed to delete menu category');
    }
  }, [isDeleteCategoryError, deleteCategoryError]);

  // Extract companies from the response
  const companies = companyListData?.data || [];
  const menus = menuListData?.data || [];
  const menuCategories = menuCategoryListData?.data || [];

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

  const validateFieldLocal = (name, value) => {
    return validateField(menuSchema, name, value);
  };

  const handleBlur = (e) => {
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

  // Menu Category handlers
  const handleMenuCategoryChange = (e) => {
    const { name, value } = e.target;
    setMenuCategoryForm({ ...menuCategoryForm, [name]: value });
    
    // Mark field as touched
    setMenuCategoryTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Clear validation error for this field
    if (menuCategoryValidationErrors[name]) {
      setMenuCategoryValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear success/error messages
    if (isSuccess || error) {
      setIsSuccess(false);
      setError('');
    }
  };

  const validateMenuCategoryFieldLocal = (name, value) => {
    return validateMenuCategoryField(menuCategorySchema, name, value);
  };

  const handleMenuCategoryBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setMenuCategoryTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate field
    const fieldError = validateMenuCategoryFieldLocal(name, value);
    setMenuCategoryValidationErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const getMenuCategoryFieldError = (fieldName) => {
    return menuCategoryTouchedFields[fieldName] && menuCategoryValidationErrors[fieldName] ? menuCategoryValidationErrors[fieldName] : '';
  };

  const getMenuCategoryFieldClassName = (fieldName, baseClasses) => {
    const hasError = getMenuCategoryFieldError(fieldName);
    return `${baseClasses} ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  const validateForm = () => {
    const validation = validateMenuForm(form);
    return validation.errors;
  };

  const validateMenuCategoryFormLocal = () => {
    const validation = validateMenuCategoryForm(menuCategoryForm);
    return validation.errors;
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
      // Validate form
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setValidationErrors(validationErrors);
        setError('Please fix the validation errors above');
        return;
      }
      setIsLoading(true);
      // Call the create menu API
      createMenu(form);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to create menu');
    }
  };

  const handleMenuCategorySubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Mark all fields as touched for validation display
      const allFields = Object.keys(menuCategoryForm);
      setMenuCategoryTouchedFields(prev => {
        const newTouched = { ...prev };
        allFields.forEach(field => {
          newTouched[field] = true;
        });
        return newTouched;
      });
      // Validate form
      const validationErrors = validateMenuCategoryFormLocal();
      if (Object.keys(validationErrors).length > 0) {
        setMenuCategoryValidationErrors(validationErrors);
        setError('Please fix the validation errors above');
        return;
      }
      setIsLoading(true);
      // Call the create menu category API
      createMenuCategory(menuCategoryForm);
    } catch (err) {
      console.error('Menu category form submission error:', err);
      setError(err.message || 'Failed to create menu category');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      companyId: '',
      status: 'ACTIVE',
    });
    setTouchedFields({});
    setValidationErrors({});
    setError('');
    setIsSuccess(false);
  };

  const resetMenuCategoryForm = () => {
    setMenuCategoryForm({
      name: '',
      description: '',
      companyId: '',
      menuId: '',
    });
    setMenuCategoryTouchedFields({});
    setMenuCategoryValidationErrors({});
    setError('');
    setIsSuccess(false);
  };

  // Edit Menu handlers
  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setEditMenuForm({
      name: menu.name,
      companyId: menu.companyId,
      status: menu.status,
    });
    setShowEditMenuModal(true);
  };

  const handleEditMenuChange = (e) => {
    const { name, value } = e.target;
    setEditMenuForm({ ...editMenuForm, [name]: value });
  };

  const handleEditMenuSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Validate the edit form data
      const validation = validateMenuForm(editMenuForm);
      if (!validation.isValid) {
        setError('Please fix the validation errors above');
        return;
      }
      updateMenu({ menuId: editingMenu.id, menuData: editMenuForm });
    } catch (err) {
      console.error('Menu update error:', err);
      setError(err.message || 'Failed to update menu');
    }
  };

  // Delete Menu handlers
  const handleDeleteMenu = (menu) => {
    setDeletingMenu(menu);
    setShowDeleteMenuModal(true);
  };

  const confirmDeleteMenu = () => {
    if (deletingMenu) {
      deleteMenu(deletingMenu.id);
    }
  };

  // Edit Category handlers
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditCategoryForm({
      name: category.name,
      description: category.description,
      companyId: category.companyId,
      menuId: category.menuId,
    });
    setShowEditCategoryModal(true);
  };

  const handleEditCategoryChange = (e) => {
    const { name, value } = e.target;
    setEditCategoryForm({ ...editCategoryForm, [name]: value });
  };

  const handleEditCategorySubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Validate the edit category form data
      const validation = validateMenuCategoryForm(editCategoryForm);
      if (!validation.isValid) {
        setError('Please fix the validation errors above');
        return;
      }
      updateMenuCategory({ menuCategoryId: editingCategory.id, menuCategoryData: editCategoryForm });
    } catch (err) {
      console.error('Category update error:', err);
      setError(err.message || 'Failed to update category');
    }
  };

  // Delete Category handlers
  const handleDeleteCategory = (category) => {
    setDeletingCategory(category);
    setShowDeleteCategoryModal(true);
  };

  const confirmDeleteCategory = () => {
    if (deletingCategory) {
      deleteMenuCategory(deletingCategory.id);
    }
  };

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
                <FaArrowLeft size={20} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Add New Menu</h1>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              Create a new menu for your restaurant with date and company information
            </p>
          </div>

          {/* Success/Error Messages */}
          {isSuccess && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Menu created successfully!</span>
              </div>
              <p className="text-green-300 text-sm mt-1">Redirecting to menus list...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="xl:col-span-2">
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Menu Information Section */}
                  <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-base font-bold text-blue-300 flex items-center gap-2 mb-3">
                      <FaUtensils className="text-blue-400" />
                      Menu Information
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-300">Menu Name <span className="text-red-400">*</span></label>
                        <input 
                          type="text" 
                          name="name" 
                          value={form.name} 
                          onChange={handleChange} 
                          onBlur={handleBlur}
                          required 
                          className={getFieldClassName('name', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors")}
                          placeholder="Enter menu name"
                          disabled={isLoading || isCreating} 
                        />
                        {getFieldError('name') && (
                          <p className="text-red-400 text-xs mt-1">{getFieldError('name')}</p>
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
                          disabled={isLoading || isCreating || companiesLoading}
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
                              onClick={() => navigate('/jkhm/admin/company-create')}
                              className="text-blue-400 hover:text-blue-300 underline mt-1"
                            >
                              Go to Create Company
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Day of Week dropdown removed */}

                      <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-300">Status</label>
                        <select 
                          name="status" 
                          value={form.status} 
                          onChange={handleChange} 
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          disabled={isLoading || isCreating}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      type="submit" 
                      className="flex-1 bg-blue-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isLoading || isCreating}
                    >
                      <FaSave className="text-sm" />
                      {isLoading || isCreating ? 'Creating Menu...' : 'Create Menu'}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="flex-1 bg-gray-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isLoading || isCreating}
                    >
                      <FaTimes className="text-sm" />
                      Reset Form
                    </button>
                  </div>
                </form>
              </div>

              {/* Menu Category Form Section */}
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-700 mt-6">
                <form onSubmit={handleMenuCategorySubmit} className="space-y-6">
                  {/* Menu Category Information Section */}
                  <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-base font-bold text-green-300 flex items-center gap-2 mb-3">
                      <FaTags className="text-green-400" />
                      Menu Category Information
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-300">Category Name <span className="text-red-400">*</span></label>
                        <input 
                          type="text" 
                          name="name" 
                          value={menuCategoryForm.name} 
                          onChange={handleMenuCategoryChange} 
                          onBlur={handleMenuCategoryBlur}
                          required 
                          className={getMenuCategoryFieldClassName('name', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors")}
                          placeholder="Enter category name"
                          disabled={isLoading || isCreatingCategory} 
                        />
                        {getMenuCategoryFieldError('name') && (
                          <p className="text-red-400 text-xs mt-1">{getMenuCategoryFieldError('name')}</p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-300">Company <span className="text-red-400">*</span></label>
                        <select 
                          name="companyId" 
                          value={menuCategoryForm.companyId} 
                          onChange={handleMenuCategoryChange} 
                          onBlur={handleMenuCategoryBlur}
                          className={getMenuCategoryFieldClassName('companyId', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors")}
                          disabled={isLoading || isCreatingCategory || companiesLoading}
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
                        {getMenuCategoryFieldError('companyId') && (
                          <p className="text-red-400 text-xs mt-1">{getMenuCategoryFieldError('companyId')}</p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-300">Menu <span className="text-red-400">*</span></label>
                        <select 
                          name="menuId" 
                          value={menuCategoryForm.menuId} 
                          onChange={handleMenuCategoryChange} 
                          onBlur={handleMenuCategoryBlur}
                          className={getMenuCategoryFieldClassName('menuId', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors")}
                          disabled={isLoading || isCreatingCategory || menusLoading}
                          required
                        >
                          <option value="">
                            {menusLoading ? 'Loading menus...' : 'Select a menu'}
                          </option>
                          {menus.map((menu) => (
                            <option key={menu.id} value={menu.id}>
                              {menu.name}
                            </option>
                          ))}
                        </select>
                        {getMenuCategoryFieldError('menuId') && (
                          <p className="text-red-400 text-xs mt-1">{getMenuCategoryFieldError('menuId')}</p>
                        )}
                        {menus.length === 0 && !menusLoading && (
                          <div className="text-xs text-red-400 mt-1">
                            <p>No menus available. Please create a menu first.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block mb-1 text-xs sm:text-sm text-gray-300">Description <span className="text-red-400">*</span></label>
                      <textarea 
                        name="description" 
                        value={menuCategoryForm.description} 
                        onChange={handleMenuCategoryChange} 
                        onBlur={handleMenuCategoryBlur}
                        required 
                        rows="3"
                        className={getMenuCategoryFieldClassName('description', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none")}
                        placeholder="Enter category description (minimum 10 characters)"
                        disabled={isLoading || isCreatingCategory} 
                      />
                      {getMenuCategoryFieldError('description') && (
                        <p className="text-red-400 text-xs mt-1">{getMenuCategoryFieldError('description')}</p>
                      )}
                    </div>
                  </div>

                  {/* Menu Category Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      type="submit" 
                      className="flex-1 bg-green-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isLoading || isCreatingCategory}
                    >
                      <FaSave className="text-sm" />
                      {isLoading || isCreatingCategory ? 'Creating Category...' : 'Create Category'}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={resetMenuCategoryForm}
                      className="flex-1 bg-gray-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isLoading || isCreatingCategory}
                    >
                      <FaTimes className="text-sm" />
                      Reset Category Form
                    </button>
                  </div>
                </form>
              </div>
            </div>
            {/* Menu List Section */}
            <div className="xl:col-span-1">
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2 mb-4">
                  <FaList className="text-blue-400" />
                  Existing Menus
                </h3>
                {menusLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-gray-400 text-sm mt-2">Loading menus...</p>
                  </div>
                ) : menus.length === 0 ? (
                  <div className="text-center py-8">
                    <FaUtensils className="text-gray-500 text-4xl mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No menus created yet</p>
                    <p className="text-gray-500 text-xs mt-1">Create your first menu using the form</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {menus.map((menu) => (
                      <div key={menu.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm mb-1">{menu.name}</h4>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p><span className="text-gray-500">Company:</span> {menu.company?.name || 'N/A'}</p>
                              <p><span className="text-gray-500">Day:</span> {menu.dayOfWeek}</p>
                              <p><span className="text-gray-500">Status:</span> 
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                  menu.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' :
                                  menu.status === 'INACTIVE' ? 'bg-red-900/30 text-red-400' :
                                  menu.status === 'DRAFT' ? 'bg-yellow-900/30 text-yellow-400' :
                                  'bg-blue-900/30 text-blue-400'
                                }`}>
                                  {menu.status}
                                </span>
                              </p>
                              <p><span className="text-gray-500">Items:</span> {menu.menuItems?.length || 0} items</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-gray-500">
                              {new Date(menu.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditMenu(menu)}
                                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors"
                                title="Edit Menu"
                                disabled={isUpdatingMenu || isDeletingMenu}
                              >
                                <FaEdit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteMenu(menu)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                                title="Delete Menu"
                                disabled={isUpdatingMenu || isDeletingMenu}
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Categories List Section */}
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-700 mt-6">
                <h3 className="text-lg font-bold text-green-300 flex items-center gap-2 mb-4">
                  <FaTags className="text-green-400" />
                  Existing Menu Categories
                </h3>
                {menuCategoriesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                    <p className="text-gray-400 text-sm mt-2">Loading menu categories...</p>
                  </div>
                ) : menuCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <FaTags className="text-gray-500 text-4xl mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No menu categories created yet</p>
                    <p className="text-gray-500 text-xs mt-1">Create your first menu category using the form</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {menuCategories.map((category) => (
                      <div key={category.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm mb-1">{category.name}</h4>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p><span className="text-gray-500">Company:</span> {category.company?.name || 'N/A'}</p>
                              <p><span className="text-gray-500">Menu:</span> {category.menu?.name || 'N/A'}</p>
                              <p><span className="text-gray-500">Description:</span> {category.description?.substring(0, 50)}...</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-gray-500">
                              {new Date(category.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="p-1 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded transition-colors"
                                title="Edit Category"
                                disabled={isUpdatingCategory || isDeletingCategory}
                              >
                                <FaEdit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                                title="Delete Category"
                                disabled={isUpdatingCategory || isDeletingCategory}
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
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
      
      {/* Mobile sidebar */}
      <div className="block md:hidden fixed bottom-0 left-0 w-full z-20">
        <AdminSlide isFooter />
      </div>

      {/* Edit Menu Modal */}
      {showEditMenuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Edit Menu</h3>
              <button
                onClick={() => setShowEditMenuModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleEditMenuSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm text-gray-300">Menu Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={editMenuForm.name} 
                  onChange={handleEditMenuChange} 
                  required 
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter menu name"
                  disabled={isUpdatingMenu} 
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-300">Company <span className="text-red-400">*</span></label>
                <select 
                  name="companyId" 
                  value={editMenuForm.companyId} 
                  onChange={handleEditMenuChange} 
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={isUpdatingMenu || companiesLoading}
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
              <div>
                <label className="block mb-1 text-sm text-gray-300">Status</label>
                <select 
                  name="status" 
                  value={editMenuForm.status} 
                  onChange={handleEditMenuChange} 
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={isUpdatingMenu}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={isUpdatingMenu}
                >
                  <FaSave className="text-sm" />
                  {isUpdatingMenu ? 'Updating...' : 'Update Menu'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditMenuModal(false)}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={isUpdatingMenu}
                >
                  <FaTimes className="text-sm" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Edit Menu Category</h3>
              <button
                onClick={() => setShowEditCategoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleEditCategorySubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm text-gray-300">Category Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={editCategoryForm.name} 
                  onChange={handleEditCategoryChange} 
                  required 
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  placeholder="Enter category name"
                  disabled={isUpdatingCategory} 
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-300">Company <span className="text-red-400">*</span></label>
                <select 
                  name="companyId" 
                  value={editCategoryForm.companyId} 
                  onChange={handleEditCategoryChange} 
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  disabled={isUpdatingCategory || companiesLoading}
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
              <div>
                <label className="block mb-1 text-sm text-gray-300">Menu <span className="text-red-400">*</span></label>
                <select 
                  name="menuId" 
                  value={editCategoryForm.menuId} 
                  onChange={handleEditCategoryChange} 
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  disabled={isUpdatingCategory || menusLoading}
                  required
                >
                  <option value="">Select a menu</option>
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-300">Description <span className="text-red-400">*</span></label>
                <textarea 
                  name="description" 
                  value={editCategoryForm.description} 
                  onChange={handleEditCategoryChange} 
                  required 
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none"
                  placeholder="Enter category description (minimum 10 characters)"
                  disabled={isUpdatingCategory} 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={isUpdatingCategory}
                >
                  <FaSave className="text-sm" />
                  {isUpdatingCategory ? 'Updating...' : 'Update Category'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditCategoryModal(false)}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={isUpdatingCategory}
                >
                  <FaTimes className="text-sm" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Menu Confirmation Modal */}
      {showDeleteMenuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Delete Menu</h3>
              <button
                onClick={() => setShowDeleteMenuModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-300 mb-2">Are you sure you want to delete this menu?</p>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-white font-semibold">{deletingMenu?.name}</p>
                <p className="text-gray-400 text-sm">Company: {deletingMenu?.company?.name}</p>
                <p className="text-gray-400 text-sm">Status: {deletingMenu?.status}</p>
              </div>
              <p className="text-red-400 text-sm mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={confirmDeleteMenu}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isDeletingMenu}
              >
                <FaTrash className="text-sm" />
                {isDeletingMenu ? 'Deleting...' : 'Delete Menu'}
              </button>
              <button 
                onClick={() => setShowDeleteMenuModal(false)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isDeletingMenu}
              >
                <FaTimes className="text-sm" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Delete Menu Category</h3>
              <button
                onClick={() => setShowDeleteCategoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-300 mb-2">Are you sure you want to delete this menu category?</p>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-white font-semibold">{deletingCategory?.name}</p>
                <p className="text-gray-400 text-sm">Company: {deletingCategory?.company?.name}</p>
                <p className="text-gray-400 text-sm">Menu: {deletingCategory?.menu?.name}</p>
              </div>
              <p className="text-red-400 text-sm mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={confirmDeleteCategory}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isDeletingCategory}
              >
                <FaTrash className="text-sm" />
                {isDeletingCategory ? 'Deleting...' : 'Delete Category'}
              </button>
              <button 
                onClick={() => setShowDeleteCategoryModal(false)}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isDeletingCategory}
              >
                <FaTimes className="text-sm" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMenuPage; 