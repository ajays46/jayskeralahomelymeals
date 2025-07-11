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
            const response = await api.put('/admin/company-delete', { id });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['companyList']);
        }
    });
};