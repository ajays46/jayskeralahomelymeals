import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

/**
 * Admin Hooks - Collection of React Query hooks for admin operations
 * Handles all admin-related API operations including CRUD operations for products, companies, menus, and users
 * Features: Company management, product management, menu management, user management, inventory tracking
 */

export const useCreateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (company) => {
            const response = await api.post('/admin/company-create', company);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['companyList']);
        }
    });
};

export const useCompanyList = () => {
    return useQuery({
        queryKey: ['companyList'],
        queryFn: async () => {
            const response = await api.get('/admin/company-list');
            return response.data;
        }
    });
};

export const useCompanyDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await api.put('/admin/company-delete', { id });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['companyList']);
        }
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (productData) => {
            const response = await api.post('/admin/product-create', productData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['productList']);
            queryClient.invalidateQueries(['companyList']);
        }
    });
};

export const useProductList = () => {
    return useQuery({
        queryKey: ['productList'],
        queryFn: async () => {
            const response = await api.get('/admin/product-list');
            return response.data;
        }
    });
};

export const useProductById = (productId) => {
    return useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const response = await api.get(`/admin/product/${productId}`);
            return response.data;
        },
        enabled: !!productId
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ productId, productData }) => {
            const response = await api.put(`/admin/product/${productId}`, productData);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['productList']);
            queryClient.invalidateQueries(['product', variables.productId]);
        }
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (productId) => {
            const response = await api.delete(`/admin/product/${productId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['productList']);
        }
    });
};

// Admin Order Management Hooks
export const useAdminOrders = (filters = {}) => {
    return useQuery({
        queryKey: ['admin-orders', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            
            if (filters.status && filters.status !== 'all') {
                params.append('status', filters.status);
            }
            if (filters.startDate) {
                params.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate);
            }
            if (filters.orderTime && filters.orderTime !== 'all') {
                params.append('orderTime', filters.orderTime);
            }
            if (filters.page) {
                params.append('page', filters.page);
            }
            if (filters.limit) {
                params.append('limit', filters.limit);
            }

            const response = await api.get(`/admin/orders?${params.toString()}`);
            return response.data;
        },
        keepPreviousData: true
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, status }) => {
            const response = await api.put(`/admin/orders/${orderId}/status`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-orders']);
        }
    });
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (orderId) => {
            const response = await api.delete(`/admin/orders/${orderId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-orders']);
        }
    });
};

// Menu hooks
export const useCreateMenu = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (menuData) => {
            const response = await api.post('/admin/menu-create', menuData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuList']);
            queryClient.invalidateQueries(['companyList']);
        }
    });
};

export const useMenuList = () => {
    return useQuery({
        queryKey: ['menuList'],
        queryFn: async () => {
            const response = await api.get('/admin/menu-list');
            return response.data;
        }
    });
};

export const useMenuById = (menuId) => {
    return useQuery({
        queryKey: ['menu', menuId],
        queryFn: async () => {
            const response = await api.get(`/admin/menu/${menuId}`);
            return response.data;
        },
        enabled: !!menuId
    });
};

export const useUpdateMenu = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ menuId, menuData }) => {
            const response = await api.put(`/admin/menu/${menuId}`, menuData);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['menuList']);
            queryClient.invalidateQueries(['menu', variables.menuId]);
        }
    });
};

export const useDeleteMenu = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (menuId) => {
            const response = await api.delete(`/admin/menu/${menuId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuList']);
        }
    });
};

// Menu Item hooks
export const useCreateMenuItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (menuItemData) => {
            const response = await api.post('/admin/menu-item-create', menuItemData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItemList']);
            queryClient.invalidateQueries(['menuList']);
        }
    });
};

export const useMenuItemList = () => {
    return useQuery({
        queryKey: ['menuItemList'],
        queryFn: async () => {
            const response = await api.get('/admin/menu-item-list');
            return response.data;
        }
    });
};

export const useMenuItemById = (menuItemId) => {
    return useQuery({
        queryKey: ['menuItem', menuItemId],
        queryFn: async () => {
            const response = await api.get(`/admin/menu-item/${menuItemId}`);
            return response.data;
        },
        enabled: !!menuItemId
    });
};

export const useUpdateMenuItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ menuItemId, menuItemData }) => {
            const response = await api.put(`/admin/menu-item/${menuItemId}`, menuItemData);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['menuItemList']);
            queryClient.invalidateQueries(['menuItem', variables.menuItemId]);
        }
    });
};

export const useDeleteMenuItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (menuItemId) => {
            const response = await api.delete(`/admin/menu-item/${menuItemId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItemList']);
        }
    });
};

// Menu Category hooks
export const useCreateMenuCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (menuCategoryData) => {
            const response = await api.post('/admin/menu-category-create', menuCategoryData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuCategoryList']);
            queryClient.invalidateQueries(['menuList']);
            queryClient.invalidateQueries(['companyList']);
        }
    });
};

export const useMenuCategoryList = () => {
    return useQuery({
        queryKey: ['menuCategoryList'],
        queryFn: async () => {
            const response = await api.get('/admin/menu-category-list');
            return response.data;
        }
    });
};

export const useMenuCategoryById = (menuCategoryId) => {
    return useQuery({
        queryKey: ['menuCategory', menuCategoryId],
        queryFn: async () => {
            const response = await api.get(`/admin/menu-category/${menuCategoryId}`);
            return response.data;
        },
        enabled: !!menuCategoryId
    });
};

export const useUpdateMenuCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ menuCategoryId, menuCategoryData }) => {
            const response = await api.put(`/admin/menu-category/${menuCategoryId}`, menuCategoryData);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['menuCategoryList']);
            queryClient.invalidateQueries(['menuCategory', variables.menuCategoryId]);
        }
    });
};

export const useDeleteMenuCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (menuCategoryId) => {
            const response = await api.delete(`/admin/menu-category/${menuCategoryId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuCategoryList']);
        }
    });
};

// Menu Item Price hooks
export const useCreateMenuItemPrice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (menuItemPriceData) => {
            const response = await api.post('/admin/menu-item-price-create', menuItemPriceData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItemPriceList']);
            queryClient.invalidateQueries(['menuItemList']);
            queryClient.invalidateQueries(['companyList']);
        }
    });
};

export const useMenuItemPriceList = () => {
    return useQuery({
        queryKey: ['menuItemPriceList'],
        queryFn: async () => {
            const response = await api.get('/admin/menu-item-price-list');
            return response.data;
        }
    });
};

export const useMenuItemPriceById = (menuItemPriceId) => {
    return useQuery({
        queryKey: ['menuItemPrice', menuItemPriceId],
        queryFn: async () => {
            const response = await api.get(`/admin/menu-item-price/${menuItemPriceId}`);
            return response.data;
        },
        enabled: !!menuItemPriceId
    });
};

export const useUpdateMenuItemPrice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ menuItemPriceId, menuItemPriceData }) => {
            const response = await api.put(`/admin/menu-item-price/${menuItemPriceId}`, menuItemPriceData);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['menuItemPriceList']);
            queryClient.invalidateQueries(['menuItemPrice', variables.menuItemPriceId]);
        }
    });
};

export const useDeleteMenuItemPrice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (menuItemPriceId) => {
            const response = await api.delete(`/admin/menu-item-price/${menuItemPriceId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItemPriceList']);
        }
    });
};

// Get meals by day hook
export const useMealsByDay = (day) => {
    return useQuery({
        queryKey: ['meals', day],
        queryFn: async () => {
            const response = await api.get(`/admin/meals?day=${day}`);
    
            
            return response.data;
        },
        enabled: !!day,
        staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
        cacheTime: 30 * 60 * 1000, // 30 minutes - cache stays longer
        refetchOnWindowFocus: false, // Prevent refetch on window focus
        refetchOnMount: false, // Prevent refetch on component mount if data exists
        keepPreviousData: true, // Keep previous data while loading new data
    });
};

// Get menus with categories and menu items for booking page (scoped by company for multi-tenant)
export const useMenusForBooking = (companyId = null) => {
    return useQuery({
        queryKey: ['menusForBooking', companyId],
        queryFn: async () => {
            const params = companyId ? { companyId } : {};
            const response = await api.get('/admin/menus-for-booking', { params });
            return response.data;
        },
        enabled: !!companyId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        keepPreviousData: true,
    });
};

// Get available user roles from the system
export const useUserRoles = () => {
    return useQuery({
        queryKey: ['userRoles'],
        queryFn: async () => {
            // For now, return the system-defined roles
            // Example: const response = await api.get('/admin/user-roles');
            // return response.data;
            return {
                success: true,
                data: [
                    { value: 'CEO', label: 'Chief Executive Officer' },
                    { value: 'CFO', label: 'Chief Financial Officer' },
                    { value: 'ADMIN', label: 'Administrator' },
                    { value: 'SELLER', label: 'Seller' },
                    { value: 'DELIVERY_EXECUTIVE', label: 'Delivery Executive' },
                    { value: 'DELIVERY_MANAGER', label: 'Delivery Manager' },
                    { value: 'USER', label: 'Regular User' }
                ]
            };
        },
        staleTime: 60 * 60 * 1000, // 1 hour - roles don't change often
        cacheTime: 24 * 60 * 60 * 1000, // 24 hours
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
};

// Admin User Management Hooks
export const useAdminUsers = () => {
    return useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            try {
                const response = await api.get('/admin/users/list');
                return response.data;
            } catch (error) {
                // Throw a more user-friendly error
                throw new Error(
                    error.response?.data?.message || 
                    error.message || 
                    'Failed to fetch users'
                );
            }
        },
        staleTime: 30 * 1000, // 30 seconds
        cacheTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 2, // Retry failed requests up to 2 times
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });
};

export const useCreateAdminUser = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (userData) => {
            // The admin ID will be automatically extracted from the JWT token on the backend
            const response = await api.post('/admin/users/create', userData);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate and refetch users list
            queryClient.invalidateQueries(['adminUsers']);
            
            // Show success message
            if (data.status === 'success') {
                alert('User created successfully!');
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || 'Failed to create user. Please try again.';
            alert(errorMessage);
        }
    });
};

// Get product quantities for menus
export const useProductQuantitiesForMenus = () => {
    return useQuery({
        queryKey: ['productQuantitiesForMenus'],
        queryFn: async () => {
            const response = await api.get('/admin/product-quantities-for-menus');
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        keepPreviousData: true,
    });
};



