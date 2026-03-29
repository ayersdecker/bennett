import { useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { useConnectionsStore } from '../stores/connectionsStore';
import { AIRouter } from '../core/ai-router';
import {
  buildConnectionCompleteReply,
  buildConnectionProgressReply,
  buildConnectionStartReply,
  createConnectionRecord,
  extractFieldValue,
  findConnectionKit,
  getNextMissingField,
  isCancelConnectionSetup,
} from '../core/connection-assistant';
import { supportsOAuthHandoff } from '../core/oauth-connections';
import { handleMCPChatRequest } from '../core/mcp-runtime';
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
  const { connections, pendingSetup, setPendingSetup, upsertConnection } = useConnectionsStore();

  const saveConversationTurn = useCallback(async (userContent: string, assistantContent: string) => {
    if (!user) {
      return;
    }

    try {
      if (conversationId) {
        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          messages: arrayUnion(
            { role: 'user', content: userContent, timestamp: new Date() },
            { role: 'assistant', content: assistantContent, timestamp: new Date() }
          ),
        });
      } else {
        const convRef = await addDoc(collection(db, 'conversations'), {
          userId: user.uid,
          createdAt: new Date(),
          messages: [
            { role: 'user', content: userContent, timestamp: new Date() },
            { role: 'assistant', content: assistantContent, timestamp: new Date() },
          ],
        });
        setConversationId(convRef.id);
      }
    } catch (error) {
      console.error('Failed to save conversation turn:', error);
    }
  }, [conversationId, setConversationId, user]);

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
      const requestedKit = findConnectionKit(content);

      if (requestedKit) {
        if (requestedKit.requiresOAuth) {
          const reply = buildConnectionStartReply(requestedKit);
          upsertConnection(createConnectionRecord(requestedKit, 'pending'));

          addMessage({
            id: generateId(),
            role: 'assistant' as const,
            content: reply,
            timestamp: new Date(),
            action: supportsOAuthHandoff(requestedKit)
              ? {
                  type: 'oauth-connect',
                  kitId: requestedKit.id,
                  label: `Connect ${requestedKit.name}`,
                }
              : undefined,
          });
          await saveConversationTurn(content, reply);
          return;
        }

        const initialValues = pendingSetup?.kitId === requestedKit.id ? pendingSetup.values : {};
        const nextField = getNextMissingField(requestedKit, initialValues);

        if (nextField) {
          upsertConnection(createConnectionRecord(requestedKit, 'pending', initialValues));
          setPendingSetup({ kitId: requestedKit.id, values: initialValues });

          const reply = buildConnectionStartReply(requestedKit, nextField.label);
          addMessage({
            id: generateId(),
            role: 'assistant' as const,
            content: reply,
            timestamp: new Date(),
          });
          await saveConversationTurn(content, reply);
          return;
        }

        const reply = buildConnectionCompleteReply(requestedKit);
        upsertConnection(createConnectionRecord(requestedKit, 'connected', initialValues));
        setPendingSetup(null);
        addMessage({
          id: generateId(),
          role: 'assistant' as const,
          content: reply,
          timestamp: new Date(),
        });
        await saveConversationTurn(content, reply);
        return;
      }

      if (pendingSetup) {
        if (isCancelConnectionSetup(content)) {
          const pendingKit = requestedKit ?? null;
          void pendingKit;
          setPendingSetup(null);
          const reply = 'Connection setup canceled.';
          addMessage({
            id: generateId(),
            role: 'assistant' as const,
            content: reply,
            timestamp: new Date(),
          });
          await saveConversationTurn(content, reply);
          return;
        }

        const pendingKit = findConnectionKit(`connect ${pendingSetup.kitId}`) || null;
        const resolvedPendingKit = pendingKit;

        if (resolvedPendingKit) {
          const nextField = getNextMissingField(resolvedPendingKit, pendingSetup.values);

          if (nextField) {
            const fieldValue = extractFieldValue(content, nextField);

            if (!fieldValue) {
              const reply = `I still need the ${nextField.label} for ${resolvedPendingKit.name}.`;
              addMessage({
                id: generateId(),
                role: 'assistant' as const,
                content: reply,
                timestamp: new Date(),
              });
              await saveConversationTurn(content, reply);
              return;
            }

            const nextValues = {
              ...pendingSetup.values,
              [nextField.key]: fieldValue,
            };
            const followingField = getNextMissingField(resolvedPendingKit, nextValues);

            if (followingField) {
              upsertConnection(createConnectionRecord(resolvedPendingKit, 'pending', nextValues));
              setPendingSetup({ kitId: resolvedPendingKit.id, values: nextValues });

              const reply = buildConnectionProgressReply(resolvedPendingKit, followingField.label);
              addMessage({
                id: generateId(),
                role: 'assistant' as const,
                content: reply,
                timestamp: new Date(),
              });
              await saveConversationTurn(content, reply);
              return;
            }

            upsertConnection(createConnectionRecord(resolvedPendingKit, 'connected', nextValues));
            setPendingSetup(null);
            const reply = buildConnectionCompleteReply(resolvedPendingKit);
            addMessage({
              id: generateId(),
              role: 'assistant' as const,
              content: reply,
              timestamp: new Date(),
            });
            await saveConversationTurn(content, reply);
            return;
          }
        }
      }

      const mcpResponse = await handleMCPChatRequest(content, connections);
      if (mcpResponse) {
        addMessage({
          id: generateId(),
          role: 'assistant' as const,
          content: mcpResponse,
          timestamp: new Date(),
        });
        await saveConversationTurn(content, mcpResponse);
        return;
      }

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

      await saveConversationTurn(content, response);
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
  }, [
    messages,
    user,
    profile,
    addMessage,
    setTyping,
    pendingSetup,
    connections,
    saveConversationTurn,
    setPendingSetup,
    upsertConnection,
  ]);

  return { messages, isTyping, sendMessage };
}
