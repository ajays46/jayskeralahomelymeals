import { useMutation,useQuery } from '@tanstack/react-query';
import api from '../../api/axios';



export const getAdmin =()=>{
    return useQuery({
        queryKey:['admin'],
        queryFn:()=>api.get('/admin/dashboard')
    })
}


