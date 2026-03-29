import { useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { AIRouter } from '../core/ai-router';
import { generateId } from '../lib/utils';

const providerApiKeyStorageKeys = {
  openai: 'bennett.openaiApiKey',
  anthropic: 'bennett.anthropicApiKey',
} as const;

function getStoredProviderApiKey(providerType: 'openai' | 'anthropic') {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(providerApiKeyStorageKeys[providerType])?.trim() || '';
}

export function useChat() {
  const { messages, isTyping, addMessage, setTyping, setConversationId, conversationId } = useChatStore();
  const { user, profile } = useAuthStore();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user) return;

    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setTyping(true);

    try {
      const providerType = profile?.preferences?.aiProvider || 'openai';
      const apiKey = providerType === 'anthropic'
        ? getStoredProviderApiKey('anthropic') || import.meta.env.VITE_ANTHROPIC_API_KEY || ''
        : getStoredProviderApiKey('openai') || import.meta.env.VITE_OPENAI_API_KEY || '';

      if (!apiKey) {
        throw new Error('Missing provider API key');
      }

      const router = new AIRouter(providerType, apiKey);

      const assistantName = profile?.preferences?.assistantName || 'Assistant';
      const history = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      history.push({ role: 'user', content });

      const systemMessage = {
        role: 'system' as const,
        content: `You are ${assistantName}, a helpful personal AI assistant. Be concise, friendly, and helpful.`,
      };

      const response = await router.chat([systemMessage, ...history]);

      const assistantMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: response,
        timestamp: new Date(),
      };

      addMessage(assistantMessage);

      if (conversationId) {
        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          messages: arrayUnion(
            { role: 'user', content, timestamp: new Date() },
            { role: 'assistant', content: response, timestamp: new Date() }
          ),
        });
      } else {
        const convRef = await addDoc(collection(db, 'conversations'), {
          userId: user.uid,
          createdAt: new Date(),
          messages: [
            { role: 'user', content, timestamp: new Date() },
            { role: 'assistant', content: response, timestamp: new Date() },
          ],
        });
        setConversationId(convRef.id);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown provider error.';
      const errorMessage = {
        id: generateId(),
        role: 'assistant' as const,
        content: `Sorry, I encountered an error. ${detail}`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setTyping(false);
    }
  }, [messages, user, profile, addMessage, setTyping, setConversationId, conversationId]);

  return { messages, isTyping, sendMessage };
}
