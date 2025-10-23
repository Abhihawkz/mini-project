import { create } from 'zustand';
const base_url = "http://localhost:4000";
const chat_url = "http://localhost:8000";

export const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  
  messages: [],
  isLoading: false,

  setTokens: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ accessToken, refreshToken, user });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ 
      accessToken: null, 
      refreshToken: null, 
      user: null,
      messages: [] 
    });
  },

  setLoading: (value) => set({ loading: value }),

  register: async (payload) => {
    set({ loading: true });
    try {
      const res = await fetch(`${base_url}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      set({ loading: false });
      return { ok: res.ok, data };
    } catch (e) {
      set({ loading: false });
      return { ok: false, error: e.message };
    }
  },

  login: async (payload) => {
    set({ loading: true });
    try {
      const res = await fetch(`${base_url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        get().setTokens(data.accessToken, data.refreshToken, data.user);
      }
      set({ loading: false });
      return { ok: res.ok, data };
    } catch (e) {
      set({ loading: false });
      return { ok: false, error: e.message };
    }
  },

  refreshTokens: async () => {
    const refreshToken = get().refreshToken;
    if (!refreshToken) return { ok: false };
    try {
      const res = await fetch(`${base_url}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (res.ok) {
        get().setTokens(data.accessToken, data.refreshToken || refreshToken, data.user || get().user);
        return { ok: true };
      }
      get().clearAuth();
      return { ok: false };
    } catch (e) {
      get().clearAuth();
      return { ok: false };
    }
  },

  logout: async () => {
    const refreshToken = get().refreshToken;
    try {
      await fetch(`${base_url}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {}
    get().clearAuth();
  },

  sendMessage: async (message) => {
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));
    
    try {
      const response = await fetch(`${chat_url}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversation_history: [],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
      
      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message || data.response || 'No response',
        timestamp: new Date().toISOString(),
      };
      
      set((state) => ({
        messages: [...state.messages, botMessage],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },
  
  clearMessages: () => set({ messages: [] }),
}));