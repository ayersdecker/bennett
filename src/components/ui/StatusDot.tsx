interface StatusDotProps {
  status: 'connected' | 'disconnected' | 'error' | 'pending';
}

export function StatusDot({ status }: StatusDotProps) {
  const colors = {
    connected: 'bg-emerald-400',
    disconnected: 'bg-gray-300',
    error: 'bg-red-400',
    pending: 'bg-amber-400',
  };

  const pulseColors = {
    connected: 'bg-emerald-400',
    disconnected: '',
    error: 'bg-red-400',
    pending: 'bg-amber-400',
  };

  return (
    <div className="relative flex items-center justify-center h-3 w-3">
      {status !== 'disconnected' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColors[status]} opacity-50`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </div>
  );
}
