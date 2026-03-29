import { MCP_REGISTRY, type MCPKit } from '../mcp/registry';
import type { MCPConnection } from '../stores/connectionsStore';

const connectionIntentPattern = /\b(connect|setup|set up|configure|link|add)\b/i;
const cancelPattern = /\b(cancel|stop|never mind|nevermind)\b/i;
const valueSeparatorPattern = /\s*(?:=|:| is )\s*/i;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getSearchTerms(kit: MCPKit) {
  const generatedTerms = [kit.id, kit.name, kit.id.replace(/-/g, ' ')];
  return [...new Set([...(kit.aliases || []), ...generatedTerms].map(normalize).filter(Boolean))];
}

export function findConnectionKit(message: string): MCPKit | null {
  const normalizedMessage = normalize(message);
  if (!connectionIntentPattern.test(message) && !/\b(mcp|integration|connection)\b/i.test(message)) {
    return null;
  }

  for (const kit of MCP_REGISTRY) {
    if (getSearchTerms(kit).some((term) => normalizedMessage.includes(term))) {
      return kit;
    }
  }

  return null;
}

export function isCancelConnectionSetup(message: string) {
  return cancelPattern.test(message);
}

export function getNextMissingField(kit: MCPKit, values: Record<string, string>) {
  return (kit.configFields || []).find((field) => !values[field.key]?.trim()) || null;
}

export function extractFieldValue(message: string, field: NonNullable<MCPKit['configFields']>[number]) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return '';
  }

  const normalizedMessage = normalize(trimmedMessage);
  const fieldHints = [field.key, field.label, field.label.replace(/api key/i, 'key')].map(normalize);

  for (const hint of fieldHints) {
    if (!hint) {
      continue;
    }

    const segments = trimmedMessage.split(valueSeparatorPattern);
    if (segments.length > 1 && normalizedMessage.includes(hint)) {
      return segments[segments.length - 1].trim();
    }
  }

  if (field.key === 'bridgeIp') {
    const ipMatch = trimmedMessage.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
    if (ipMatch) {
      return ipMatch[0];
    }
  }

  return trimmedMessage;
}

export function createConnectionRecord(
  kit: MCPKit,
  status: MCPConnection['status'],
  values: Record<string, string> = {},
  oauthToken?: string
): MCPConnection {
  return {
    id: kit.id,
    name: kit.name,
    category: kit.category,
    icon: kit.iconName,
    description: kit.description,
    status,
    config: {
      apiKey: values.apiKey,
      values,
      oauthToken,
      permissions: kit.oauthScopes || [],
    },
  };
}

export function buildConnectionStartReply(kit: MCPKit, firstField?: string) {
  if (kit.requiresOAuth) {
    if (kit.category === 'google') {
      return `I recognized that as a request to set up the ${kit.name} MCP connection. Use the connect button below and I will request the Google permissions for you here in chat.`;
    }

    return `I recognized that as a request to set up the ${kit.name} MCP connection. This integration requires OAuth, so I marked it as pending. Open the Connections screen to finish authorization.`;
  }

  if (firstField) {
    return `I can set up the ${kit.name} MCP connection here. Send me the ${firstField} and I will save the connection.`;
  }

  return `The ${kit.name} MCP connection is ready.`;
}

export function buildConnectionProgressReply(kit: MCPKit, nextFieldLabel: string) {
  return `Saved that for ${kit.name}. Send me the ${nextFieldLabel} next.`;
}

export function buildConnectionCompleteReply(kit: MCPKit) {
  return `The ${kit.name} MCP connection is now configured and marked as connected.`;
}