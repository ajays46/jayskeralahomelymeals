import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { showRegistrationSuccess, showRegistrationError } from '../../utils/toastConfig.jsx';
import { trackGaEvent } from '../../utils/analytics';

const registerUser = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
    onSuccess: (_data, variables) => {
      const identifier = String(variables?.identifier || '').trim();
      const identifierType = identifier.includes('@') ? 'email' : 'phone';
      trackGaEvent('sign_up', {
        method: 'password',
        identifier_type: identifierType,
        company_path: variables?.companyPath || 'unknown',
      });
      showRegistrationSuccess();
    },
    onError: (error) => {
      showRegistrationError(error);
      throw error;
    },
  });
}; 