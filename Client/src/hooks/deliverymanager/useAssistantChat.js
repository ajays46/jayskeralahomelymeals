import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import { API } from '../../api/endpoints';

const MAX_TOKENS = 512;
const TEMPERATURE = 0.7;

function getErrorMessage(res) {
  const data = res?.data;
  const code = data?.code;
  const msg = data?.error || res?.message || 'Something went wrong';
  if (res?.status === 401) return 'Please log in again.';
  if (res?.status === 400 && code === 'VALIDATION_ERROR') return msg;
  if (res?.status === 403 && (code === 'USER_REQUIRED' || code === 'ROLE_FORBIDDEN'))
    return 'This feature is for delivery managers and administrators only.';
  if (res?.status === 429) return 'Too many requests. Please try again in a minute.';
  if (res?.status === 504) return 'The assistant is taking too long. Please try again.';
  if (res?.status === 500) return 'The assistant is temporarily unavailable. Please try again.';
  return msg;
}

/**
 * React Query mutation for assistant chat. Sends messages to /assistant/chat
 * and returns the assistant reply. Component owns message list and handles
 * optimistic updates / rollback.
 *
 * @returns { useMutation } mutate({ nextMessages, companyId, userId }) -> assistant message
 */
export function useAssistantChat() {
  return useMutation({
    mutationFn: async ({ nextMessages, companyId, userId }) => {
      try {
        const { data } = await axiosInstance.post(
          `${API.JAICE}/assistant/chat`,
          { messages: nextMessages, max_tokens: MAX_TOKENS, temperature: TEMPERATURE },
          {
            headers: {
              'X-Company-ID': companyId,
              'X-User-ID': userId
            }
          }
        );
        return data.message;
      } catch (err) {
        const message = getErrorMessage(err.response || err);
        throw new Error(message);
      }
    },
  });
}

export default useAssistantChat;
