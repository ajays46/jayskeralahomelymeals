import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';

export const useCreateCompany = () => {
    return useMutation({
        mutationFn: async (company) => {
            const response = await api.post('/admin/company-create', company);
            return response.data;
        }
    });
}   