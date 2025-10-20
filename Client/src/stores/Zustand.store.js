import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useAuthStore - Global authentication state management using Zustand
 * Handles user authentication state, roles, and token management
 * Features: Persistent storage, role-based access, token management, logout functionality
 */
const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            roles: [], // All available roles
            activeRole: null, // Currently selected role
            showRoleSelector: false, // Flag to show role selection sidebar
            setAccessToken: (token) => set({ accessToken: token }),
            setRoles: (roles) => set({ roles }), // Set all available roles
            setActiveRole: (role) => set({ activeRole: role }), // Set currently active role
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
            setShowRoleSelector: (show) => set({ showRoleSelector: show }),
            switchRole: (newRole) => {
                const state = get();
                if (state.roles.includes(newRole)) {
                    set({ activeRole: newRole });
                    // Update user object with new active role
                    const updatedUser = {
                        ...state.user,
                        role: newRole
                    };
                    set({ user: updatedUser });
                }
            },
            clearAccessToken: () => set({ accessToken: null }),
            logout: () => set({ 
                user: null, 
                isAuthenticated: false, 
                accessToken: null, 
                roles: [], // Clear roles array
                activeRole: null,
                showRoleSelector: false
            })
        }),{name:"_app"},
    )
)

export default useAuthStore;