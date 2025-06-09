import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            token: null,
            login: (user, token) => set({ user, token,}),
            updateAccessToken: (token) => set({ token }),
        }),
    )
)

export default useAuthStore;