export interface MCPKit {
  id: string;
  name: string;
  category: 'google' | 'smart-home' | 'custom';
  iconName: string;
  description: string;
  requiresOAuth: boolean;
  oauthScopes?: string[];
  configFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'password';
    placeholder?: string;
  }>;
}

export const MCP_REGISTRY: MCPKit[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'google',
    iconName: 'Mail',
    description: 'Read and send emails',
    requiresOAuth: true,
    oauthScopes: ['gmail.readonly', 'gmail.send'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'google',
    iconName: 'Calendar',
    description: 'Manage events and reminders',
    requiresOAuth: true,
    oauthScopes: ['calendar.readonly', 'calendar.events'],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'google',
    iconName: 'HardDrive',
    description: 'Access and manage files',
    requiresOAuth: true,
    oauthScopes: ['drive.readonly', 'drive.file'],
  },
  {
    id: 'google-tasks',
    name: 'Google Tasks',
    category: 'google',
    iconName: 'CheckSquare',
    description: 'Manage tasks and to-dos',
    requiresOAuth: true,
    oauthScopes: ['tasks'],
  },
  {
    id: 'google-contacts',
    name: 'Google Contacts',
    category: 'google',
    iconName: 'Users',
    description: 'Access your contacts',
    requiresOAuth: true,
    oauthScopes: ['contacts.readonly'],
  },
  {
    id: 'philips-hue',
    name: 'Philips Hue',
    category: 'smart-home',
    iconName: 'Lightbulb',
    description: 'Control your smart lights',
    requiresOAuth: false,
    configFields: [
      { key: 'bridgeIp', label: 'Bridge IP Address', type: 'text', placeholder: '192.168.1.x' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Hue API key' },
    ],
  },
  {
    id: 'weather',
    name: 'Weather',
    category: 'custom',
    iconName: 'Cloud',
    description: 'Current weather and forecasts',
    requiresOAuth: false,
    configFields: [
      { key: 'apiKey', label: 'OpenWeather API Key', type: 'password' },
    ],
  },
  {
    id: 'maps',
    name: 'Maps & Location',
    category: 'custom',
    iconName: 'MapPin',
    description: 'Location and navigation',
    requiresOAuth: false,
    configFields: [
      { key: 'apiKey', label: 'Maps API Key', type: 'password' },
    ],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'custom',
    iconName: 'Music',
    description: 'Control music playback',
    requiresOAuth: true,
    oauthScopes: ['user-read-playback-state', 'user-modify-playback-state'],
  },
  {
    id: 'news',
    name: 'News',
    category: 'custom',
    iconName: 'Newspaper',
    description: 'Latest news and articles',
    requiresOAuth: false,
    configFields: [
      { key: 'apiKey', label: 'News API Key', type: 'password' },
    ],
  },
];
