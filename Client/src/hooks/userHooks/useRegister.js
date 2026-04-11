import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { showRegistrationSuccess, showRegistrationError } from '../../utils/toastConfig.jsx';
import { API } from '../../api/endpoints';

const registerUser = async (userData) => {
  const { data } = await api.post(`${API.AUTH}/register`, userData);
  return data;
};

export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      showRegistrationSuccess();
    },
    onError: (error) => {
      showRegistrationError(error);
      throw error;
    },
  });
}; 