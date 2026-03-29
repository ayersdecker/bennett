import { NavLink } from 'react-router-dom';
import { MessageCircle, Plug, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: MessageCircle, label: 'Chat' },
  { to: '/connections', icon: Plug, label: 'Connections' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Navigation() {
  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-4 left-4 right-4 md:hidden bg-white/90 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-100 px-2 py-2 z-50">
        <div className="flex justify-around">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600'
                    : 'text-gray-500 hover:text-indigo-500'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-white border-r border-gray-100 shadow-sm z-50">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Bennett</h1>
              <p className="text-xs text-gray-500">AI Assistant</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-500'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
