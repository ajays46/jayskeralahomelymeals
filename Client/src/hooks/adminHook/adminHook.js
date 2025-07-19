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

// New hooks for booking page
export const useProductsByMealCategory = (mealCategory) => {
  return useQuery({
    queryKey: ['products', 'meal', mealCategory],
    queryFn: async () => {
      const response = await api.get(`/admin/products/meal/${mealCategory}`);
      return response.data.data;
    },
    enabled: !!mealCategory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAllActiveProducts = () => {
  return useQuery({
    queryKey: ['products', 'active'],
    queryFn: async () => {
      const response = await api.get('/admin/products/active');      
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// New hook for fetching menu items by date
export const useMenuItemsByDate = (selectedDate) => {
  return useQuery({
    queryKey: ['menuItems', 'date', selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      const dateString = selectedDate.toISOString().split('T')[0];
      const response = await api.get(`/admin/menu-items/date/${dateString}`);
      return response.data.data;
    },
    enabled: !!selectedDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
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

