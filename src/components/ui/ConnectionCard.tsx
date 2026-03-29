import { Mail, Calendar, HardDrive, Users, CheckSquare, Lightbulb, Cloud, MapPin, Music, Newspaper, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatusDot } from './StatusDot';
import { Button } from './Button';
import type { MCPKit } from '../../mcp/registry';
import type { MCPConnection } from '../../stores/connectionsStore';

const iconMap: Record<string, LucideIcon> = {
  Mail,
  Calendar,
  HardDrive,
  Users,
  CheckSquare,
  Lightbulb,
  Cloud,
  MapPin,
  Music,
  Newspaper,
  Plus,
};

interface ConnectionCardProps {
  kit: MCPKit;
  connection?: MCPConnection;
  onConnect: (kitId: string) => void;
  onConfigure: (kitId: string) => void;
  onRemove: (kitId: string) => void;
}

export function ConnectionCard({ kit, connection, onConnect, onConfigure, onRemove }: ConnectionCardProps) {
  const Icon = iconMap[kit.iconName] || Plus;
  const isConnected = connection?.status === 'connected';

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{kit.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{kit.description}</p>
          </div>
        </div>
        <StatusDot status={connection?.status ?? 'disconnected'} />
      </div>

      <div className="flex gap-2 mt-4">
        {!isConnected ? (
          <Button size="sm" onClick={() => onConnect(kit.id)}>
            Connect
          </Button>
        ) : (
          <>
            <Button size="sm" variant="secondary" onClick={() => onConfigure(kit.id)}>
              Configure
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onRemove(kit.id)}>
              Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
