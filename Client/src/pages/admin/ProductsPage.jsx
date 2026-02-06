import React, { useState, useMemo, useCallback } from 'react';
import { FaList, FaEdit, FaTrash, FaPlus, FaBuilding, FaTag, FaCoins, FaBoxes, FaCalendar } from 'react-icons/fa';
import AdminSlide from '../../components/AdminSlide';
import Pagination from '../../components/Pagination';
import { useProductList, useDeleteProduct } from '../../hooks/adminHook/adminHook';
import { useNavigate } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Button, Popconfirm, message } from 'antd';

/**
 * ProductsPage - Product listing and management page with advanced filtering
 * Handles product display, search, filtering, and CRUD operations
 * Features: Advanced filtering, search, pagination, bulk operations, product management
 */
const ProductsPage = () => {
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();
  const { data: productListData, isLoading, error, refetch } = useProductList();
  const deleteProductMutation = useDeleteProduct();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Extract products from the response
  const products = productListData?.data || [];

  // Automatically extracts unique categories
  const uniqueCategories = [...new Set(
    products
      .filter(product => product.categories && product.categories.length > 0)
      .map(product => product.categories[0].productCategoryName)
  )].sort();

  // Filter products based on search, status, category, and price
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.company?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || product.status === statusFilter;
      
      const matchesCategory = categoryFilter === 'ALL' || 
        (product.categories && product.categories.length > 0 && 
         product.categories[0].productCategoryName === categoryFilter);
      
      const productPrice = product.prices && product.prices.length > 0 ? product.prices[0].price : 0;
      const matchesMinPrice = !priceRange.min || productPrice >= parseFloat(priceRange.min);
      const matchesMaxPrice = !priceRange.max || productPrice <= parseFloat(priceRange.max);
      
      return matchesSearch && matchesStatus && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });
  }, [products, searchTerm, statusFilter, categoryFilter, priceRange]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, priceRange]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-900/20';
      case 'INACTIVE': return 'text-gray-400 bg-gray-900/20';
      case 'OUT_OF_STOCK': return 'text-red-400 bg-red-900/20';
      case 'DISCONTINUED': return 'text-orange-400 bg-orange-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handleDeleteProduct = async (productId, productName) => {
    try {
      await deleteProductMutation.mutateAsync(productId);
      message.success(`Product "${productName}" deleted successfully`);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete product';
      message.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-900 text-gray-100">
        <div className="hidden md:block">
          <AdminSlide />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-900 text-gray-100">
        <div className="hidden md:block">
          <AdminSlide />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error loading products</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Header */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FaList className="text-teal-400 text-2xl" />
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-teal-300">Products</h1>
                    <p className="text-gray-400 text-sm">Manage your product inventory</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`${basePath}/admin/add-product`)}
                  className="bg-teal-600 hover:bg-teal-700 border-teal-600 text-white flex items-center gap-2"
                >
                  <FaPlus className="text-sm" />
                  Add Product
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Search Products</label>
                  <input
                    type="text"
                    placeholder="Search by name, code, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-100 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Status Filter</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-100 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="DISCONTINUED">Discontinued</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Category Filter</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-100 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="ALL">All Categories</option>
                    {uniqueCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Min Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Min price"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-100 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Max Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Max price"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-100 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              
              {/* Results Summary */}
              <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm text-gray-400">
                  Showing {totalItems} of {products.length} products
                </div>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setCategoryFilter('ALL');
                      setPriceRange({ min: '', max: '' });
                    }}
                    className="bg-gray-600 hover:bg-gray-700 border-gray-600 text-white"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {totalItems === 0 ? (
              <div className="bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
                <FaList className="text-gray-600 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No products found</h3>
                <p className="text-gray-400 mb-4">
                  {products.length === 0 
                    ? "You haven't added any products yet." 
                    : "No products match your search criteria."
                  }
                </p>
                {products.length === 0 && (
                  <Button
                    onClick={() => navigate(`${basePath}/admin/add-product`)}
                    className="bg-teal-600 hover:bg-teal-700 border-teal-600 text-white"
                  >
                    Add Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <div key={product.id} className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden hover:shadow-3xl transition-shadow">
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-700">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:5000${product.imageUrl}`}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gray-700 flex items-center justify-center" style={{ display: product.imageUrl ? 'none' : 'flex' }}>
                        <FaTag className="text-gray-500 text-3xl" />
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {product.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 sm:p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-100 mb-1 truncate">
                          {product.productName}
                        </h3>
                        <p className="text-gray-400 text-sm font-mono mb-2">
                          Code: {product.code}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <FaBuilding className="text-teal-400" />
                          <span>{product.company?.name || 'Unknown Company'}</span>
                        </div>
                      </div>

                      {/* Category */}
                      {product.categories && product.categories.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <FaTag className="text-orange-400" />
                            <span>Category</span>
                          </div>
                          <p className="text-gray-300 text-sm">
                            {product.categories[0].productCategoryName}
                          </p>
                        </div>
                      )}

                      {/* Price and Quantity */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <FaCoins className="text-green-400" />
                            <span>Price</span>
                          </div>
                          <p className="text-green-400 font-semibold">
                            {product.prices && product.prices.length > 0 
                              ? formatPrice(product.prices[0].price)
                              : 'Not set'
                            }
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <FaBoxes className="text-purple-400" />
                            <span>Stock</span>
                          </div>
                          <p className="text-purple-400 font-semibold">
                            {product.quantities && product.quantities.length > 0 
                              ? product.quantities[0].quantity
                              : 'Not set'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        <FaCalendar />
                        <span>Created: {formatDate(product.createdAt)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="small"
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 border-yellow-600 text-white"
                          icon={<FaEdit />}
                          onClick={() => navigate(`${basePath}/admin/add-product/${product.id}`)}
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Delete this product?"
                          description={`Are you sure you want to delete "${product.productName}"? This action cannot be undone.`}
                          onConfirm={() => handleDeleteProduct(product.id, product.productName)}
                          okText="Yes, Delete"
                          cancelText="Cancel"
                          okButtonProps={{ 
                            danger: true,
                            loading: deleteProductMutation.isPending 
                          }}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<FaTrash />}
                            loading={deleteProductMutation.isPending}
                          >
                            Delete
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalItems > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    showItemsPerPage={false} // Hide items per page for grid layout
                  />
                </div>
              )}
              </>
            )}
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

export default ProductsPage; 