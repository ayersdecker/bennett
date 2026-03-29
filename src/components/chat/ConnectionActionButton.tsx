import { useState } from 'react';
import { Button } from '../ui/Button';
import { getMCPKitById } from '../../mcp/registry';
import { connectOAuthKit } from '../../core/oauth-connections';
import { createConnectionRecord } from '../../core/connection-assistant';
import { useConnectionsStore } from '../../stores/connectionsStore';
import { useChatStore } from '../../stores/chatStore';
import { generateId } from '../../lib/utils';

interface ConnectionActionButtonProps {
  kitId: string;
  label: string;
}

export function ConnectionActionButton({ kitId, label }: ConnectionActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const { upsertConnection, setPendingSetup } = useConnectionsStore();
  const { addMessage } = useChatStore();

  const handleConnect = async () => {
    const kit = getMCPKitById(kitId);
    if (!kit) {
      return;
    }

    setLoading(true);
    try {
      const result = await connectOAuthKit(kit);
      upsertConnection(createConnectionRecord(kit, 'connected', {}, result.oauthToken));
      setPendingSetup(null);
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `The ${kit.name} MCP connection is now authorized and marked as connected.`,
        timestamp: new Date(),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'OAuth authorization failed.';
      upsertConnection(createConnectionRecord(kit, 'error'));
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `I could not finish the ${kit.name} OAuth connection. ${detail}`,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <Button size="sm" onClick={handleConnect} loading={loading}>
        {label}
      </Button>
    </div>
  );
}