import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            roles: [], // Changed from role to roles array
            setAccessToken: (token) => set({ accessToken: token }),
            setRoles: (roles) => set({ roles }), // Changed from setRole to setRoles
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
            clearAccessToken: () => set({ accessToken: null }),
            logout: () => set({ 
                user: null, 
                isAuthenticated: false, 
                accessToken: null, 
                roles: [] // Clear roles array
            })
        }),{name:"_app"},
    )
)

export default useAuthStore;