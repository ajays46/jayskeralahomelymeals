import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Drives which bucket `_app` uses: `1` = localStorage (Remember me), `0` = sessionStorage (this browser only). */
export const AUTH_REMEMBER_STORAGE_KEY = '__auth_remember_persist';

/**
 * Call on successful login before updating auth state so persist writes to the correct storage.
 * @param {boolean} remember - Same as “Remember me” on the login form
 */
export function applyAuthPersistMode(remember) {
    if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return;
    localStorage.setItem(AUTH_REMEMBER_STORAGE_KEY, remember ? '1' : '0');
    const name = '_app';
    if (remember) {
        sessionStorage.removeItem(name);
    } else {
        localStorage.removeItem(name);
    }
}

/** Clear persisted auth from both buckets and the remember flag (e.g. after logout). */
export function wipeAuthPersistStores() {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('_app');
        localStorage.removeItem(AUTH_REMEMBER_STORAGE_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('_app');
    }
}

const dualAuthStorage = {
    getItem: (name) => {
        if (typeof window === 'undefined') return null;
        const flag = localStorage.getItem(AUTH_REMEMBER_STORAGE_KEY);
        if (flag === '0') {
            return sessionStorage.getItem(name) ?? localStorage.getItem(name);
        }
        if (flag === '1') {
            return localStorage.getItem(name) ?? sessionStorage.getItem(name);
        }
        return localStorage.getItem(name) ?? sessionStorage.getItem(name);
    },
    setItem: (name, value) => {
        if (typeof window === 'undefined') return;
        const flag = localStorage.getItem(AUTH_REMEMBER_STORAGE_KEY);
        if (flag === '0') {
            localStorage.removeItem(name);
            sessionStorage.setItem(name, value);
        } else if (flag === '1') {
            sessionStorage.removeItem(name);
            localStorage.setItem(name, value);
        } else {
            sessionStorage.removeItem(name);
            localStorage.setItem(name, value);
        }
    },
    removeItem: (name) => {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(name);
        localStorage.removeItem(name);
    },
};

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
            logout: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    accessToken: null,
                    roles: [],
                    activeRole: null,
                    showRoleSelector: false,
                });
                wipeAuthPersistStores();
            },
        }),
        {
            name: "_app",
            storage: createJSONStorage(() => dualAuthStorage),
            // Never persist accessToken - memory only; refresh token is in HttpOnly cookie
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                roles: state.roles,
                activeRole: state.activeRole,
                showRoleSelector: state.showRoleSelector,
            }),
        }
    )
)

export default useAuthStore;
