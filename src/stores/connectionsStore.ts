import { create } from 'zustand';

export interface MCPConnection {
  id: string;
  name: string;
  category: 'google' | 'smart-home' | 'custom';
  icon: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  config?: {
    apiKey?: string;
    values?: Record<string, string>;
    oauthToken?: string;
    permissions: string[];
  };
}

export interface PendingConnectionSetup {
  kitId: string;
  values: Record<string, string>;
}

interface ConnectionsState {
  connections: MCPConnection[];
  pendingSetup: PendingConnectionSetup | null;
  setConnections: (connections: MCPConnection[]) => void;
  upsertConnection: (connection: MCPConnection) => void;
  updateConnection: (id: string, updates: Partial<MCPConnection>) => void;
  setPendingSetup: (pendingSetup: PendingConnectionSetup | null) => void;
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  connections: [],
  pendingSetup: null,
  setConnections: (connections) => set({ connections }),
  upsertConnection: (connection) =>
    set((state) => {
      const existingIndex = state.connections.findIndex((c) => c.id === connection.id);
      if (existingIndex === -1) {
        return { connections: [...state.connections, connection] };
      }

      return {
        connections: state.connections.map((c) =>
          c.id === connection.id ? { ...c, ...connection } : c
        ),
      };
    }),
  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  setPendingSetup: (pendingSetup) => set({ pendingSetup }),
}));
