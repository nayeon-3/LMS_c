import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  async login({ id, password, role }) {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const normalizedBase = base.replace(/\/+$/, '');
    const apiRoot = normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`;
    const res = await fetch(`${apiRoot}/auth/${role}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
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
}));


