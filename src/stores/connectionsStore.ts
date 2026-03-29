import { create } from 'zustand';

export interface MCPConnection {
  id: string;
  name: string;
  category: 'google' | 'smart-home' | 'custom';
  icon: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  config?: {
    apiKey?: string;
    oauthToken?: string;
    permissions: string[];
  };
}

interface ConnectionsState {
  connections: MCPConnection[];
  setConnections: (connections: MCPConnection[]) => void;
  updateConnection: (id: string, updates: Partial<MCPConnection>) => void;
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  connections: [],
  setConnections: (connections) => set({ connections }),
  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
}));
