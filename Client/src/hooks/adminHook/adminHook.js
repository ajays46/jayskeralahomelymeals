import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

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
            const response = await api.put('/admin/admin/company-delete', { id });
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

// Get menus with categories and menu items for booking page
export const useMenusForBooking = () => {
    return useQuery({
        queryKey: ['menusForBooking'],
        queryFn: async () => {
            const response = await api.get('/admin/menus-for-booking');
            return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        keepPreviousData: true,
    });
};



