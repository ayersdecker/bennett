import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface UserPreferences {
  aiProvider: 'openai' | 'anthropic';
  theme: 'light' | 'dark';
  assistantName: string;
}

interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  preferences: UserPreferences;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));
