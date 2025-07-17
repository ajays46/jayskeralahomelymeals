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

