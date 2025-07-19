import React, { useState, useEffect } from 'react';
import { FaPlus, FaUtensils, FaBuilding, FaCalendar, FaSave, FaTimes, FaArrowLeft, FaList } from 'react-icons/fa';
import AdminSlide from '../../components/AdminSlide';
import { useCompanyList, useCreateMenu, useMenuList } from '../../hooks/adminHook/adminHook';
import { useNavigate } from 'react-router-dom';
import { validateMenuForm, validateField, menuSchema } from '../../validations/menuValidation';
import 'antd/dist/reset.css';

const AddMenuPage = () => {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: '',
    companyId: '',
    dayOfWeek: 'MONDAY',
    status: 'ACTIVE',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const { data: companyListData, isLoading: companiesLoading } = useCompanyList();
  const { mutate: createMenu, isLoading: isCreating, isError, isSuccess: menuCreated, error: menuError, reset } = useCreateMenu();
  const { data: menuListData, isLoading: menusLoading } = useMenuList();

  // Handle mutation success/error states
  useEffect(() => {
    if (menuCreated) {
      console.log('Menu created successfully');
      setIsSuccess(true);
      setForm({
        name: '',
        companyId: '',
        dayOfWeek: 'MONDAY',
        status: 'ACTIVE',
      });
      setTouchedFields({});
      setValidationErrors({});
      
      // Show success message and navigate
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/admin');
      }, 2000);
    }
  }, [menuCreated, navigate]);

  useEffect(() => {
    if (isError && menuError) {
      console.error('Menu creation error:', menuError);
      setError(menuError.response?.data?.message || menuError.message || 'Failed to create menu');
    }
  }, [isError, menuError]);

  // Extract companies from the response
  const companies = companyListData?.data || [];
  const menus = menuListData?.data || [];

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

  const validateForm = () => {
    const validation = validateMenuForm(form);
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

  const resetForm = () => {
    setForm({
      name: '',
      companyId: '',
      dayOfWeek: 'MONDAY',
      status: 'ACTIVE',
    });
    setTouchedFields({});
    setValidationErrors({});
    setError('');
    setIsSuccess(false);
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
                onClick={() => navigate('/admin')}
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
                              onClick={() => navigate('/admin/company-create')}
                              className="text-blue-400 hover:text-blue-300 underline mt-1"
                            >
                              Go to Create Company
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-xs sm:text-sm text-gray-300">Day of Week <span className="text-red-400">*</span></label>
                        <select 
                          name="dayOfWeek" 
                          value={form.dayOfWeek} 
                          onChange={handleChange} 
                          onBlur={handleBlur}
                          required
                          className={getFieldClassName('dayOfWeek', "w-full bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors")}
                          disabled={isLoading || isCreating}
                        >
                          <option value="MONDAY">Monday</option>
                          <option value="TUESDAY">Tuesday</option>
                          <option value="WEDNESDAY">Wednesday</option>
                          <option value="THURSDAY">Thursday</option>
                          <option value="FRIDAY">Friday</option>
                          <option value="SATURDAY">Saturday</option>
                          <option value="SUNDAY">Sunday</option>
                        </select>
                        {getFieldError('dayOfWeek') && (
                          <p className="text-red-400 text-xs mt-1">{getFieldError('dayOfWeek')}</p>
                        )}
                      </div>

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
                          <div className="text-xs text-gray-500 ml-2">
                            {new Date(menu.createdAt).toLocaleDateString()}
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
    </div>
  );
};

export default AddMenuPage; 