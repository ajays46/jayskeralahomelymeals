import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

export const useGetAdmin = () => {
    return useQuery({
        queryKey: ['admin'],
        queryFn: () => api.get(`${API.ADMIN}/dashboard`)
    });
};


