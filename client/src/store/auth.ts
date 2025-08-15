import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Role = 'admin' | 'teacher' | 'student';

type User = {
  id: string;
  username: string;
  role: Role;
};

type AuthState = {
  token: string | null;
  user: User | null;
  login: (args: { id: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      async login({ id, password, role }) {
        // Use relative URL for API requests in the browser
        const apiRoot = '/api';
        console.log(`Attempting login to: ${apiRoot}/auth/${role}/login`);

        const res = await fetch(`${apiRoot}/auth/${role}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, password }),
          credentials: 'include' // Important for cookies/sessions
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const message = body?.message || '로그인 실패';
          throw new Error(message);
        }
        const data = await res.json();
        set({ token: data.token, user: data.user });
      },
      logout() {
        set({ token: null, user: null });
      }
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);


