import { useState } from 'react';
import { X, Key } from 'lucide-react';
import { MCP_REGISTRY } from '../mcp/registry';
import type { MCPKit } from '../mcp/registry';
import { ConnectionCard } from '../components/ui/ConnectionCard';
import { useConnectionsStore } from '../stores/connectionsStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

type Category = 'all' | 'google' | 'smart-home' | 'custom';

export function Connections() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [modalKit, setModalKit] = useState<MCPKit | null>(null);
  const [apiKey, setApiKey] = useState('');
  const { connections, updateConnection } = useConnectionsStore();

  const categories: Array<{ id: Category; label: string; emoji: string }> = [
    { id: 'all', label: 'All', emoji: '🔌' },
    { id: 'google', label: 'Google', emoji: '🔗' },
    { id: 'smart-home', label: 'Smart Home', emoji: '🏠' },
    { id: 'custom', label: 'MCP Kits', emoji: '⚡' },
  ];

  const filtered = activeCategory === 'all'
    ? MCP_REGISTRY
    : MCP_REGISTRY.filter((k) => k.category === activeCategory);

  const handleConnect = (kitId: string) => {
    const kit = MCP_REGISTRY.find((k) => k.id === kitId);
    if (kit) setModalKit(kit);
  };

  const handleSaveConnection = () => {
    if (!modalKit) return;
    updateConnection(modalKit.id, {
      id: modalKit.id,
      name: modalKit.name,
      category: modalKit.category,
      icon: modalKit.iconName,
      description: modalKit.description,
      status: 'connected',
      config: { apiKey, permissions: [] },
    });
    setModalKit(null);
    setApiKey('');
  };

  const handleRemove = (kitId: string) => {
    updateConnection(kitId, { status: 'disconnected' });
  };

  return (
    <div className="min-h-screen md:pl-64 bg-background pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Connect services to expand your assistant's capabilities
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>

        {/* Connection cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((kit) => (
            <ConnectionCard
              key={kit.id}
              kit={kit}
              connection={connections.find((c) => c.id === kit.id)}
              onConnect={handleConnect}
              onConfigure={(id) => handleConnect(id)}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      {/* Configure Modal */}
      {modalKit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Configure {modalKit.name}</h3>
              <button
                onClick={() => setModalKit(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalKit.requiresOAuth ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Connect with Google OAuth to grant access to {modalKit.name}.
                </p>
                <Button onClick={handleSaveConnection} className="w-full">
                  Connect with Google
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {(modalKit.configFields || []).map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    type={field.type}
                    icon={Key}
                    placeholder={field.placeholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                ))}
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setModalKit(null)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSaveConnection}>
                    Save & Connect
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
