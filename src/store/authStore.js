import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username, password) => {
        if (username === 'admin' && password === 'admin123') {
          set({ 
            isAuthenticated: true, 
            user: { 
              id: 'admin', 
              role: 'admin', 
              name: 'Administrator' 
            } 
          });
          return true;
        } else if (username === 'user' && password === 'user123') {
          set({ 
            isAuthenticated: true, 
            user: { 
              id: 'user', 
              role: 'user', 
              name: 'User' 
            } 
          });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ isAuthenticated: false, user: null });
      },
    }),
    {
      name: 'o2d-auth-storage',
    }
  )
);

export default useAuthStore;