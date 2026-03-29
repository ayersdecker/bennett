import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type: 'oauth-connect';
    kitId: string;
    label: string;
  };
}

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  conversationId: string | null;
  addMessage: (message: Message) => void;
  setTyping: (typing: boolean) => void;
  setConversationId: (id: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  conversationId: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setTyping: (typing) => set({ isTyping: typing }),
  setConversationId: (id) => set({ conversationId: id }),
  clearMessages: () => set({ messages: [] }),
}));
