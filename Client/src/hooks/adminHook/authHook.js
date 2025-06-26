import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

export const useGetAdmin = () => {
    return useQuery({
        queryKey: ['admin'],
        queryFn: () => api.get('/admin/dashboard')
    });
};


