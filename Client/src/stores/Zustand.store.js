import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            role: null,
            setAccessToken: (token) => set({ accessToken: token }),
            setRole: (role) => set({ role }), 
            clearAccessToken: () => set({ accessToken: null })
        }),{name:"_app"},
    )
)

export default useAuthStore;