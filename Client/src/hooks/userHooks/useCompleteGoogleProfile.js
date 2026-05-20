import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore from '../../stores/Zustand.store';

export const useCompleteGoogleProfile = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async ({ phone, termsAccepted }) => {
      const response = await api.post('/auth/google/complete-profile', { phone, termsAccepted });
      return response.data;
    },
    onSuccess: (data) => {
      if (!data?.success || !data?.data) return;
      setUser({
        ...(user || {}),
        ...data.data,
      });
    }
  });
};
