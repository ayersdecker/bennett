import { getMCPKitById, MCP_REGISTRY } from '../mcp/registry';
import type { MCPConnection } from '../stores/connectionsStore';

type SupportedKitId =
  | 'gmail'
  | 'google-calendar'
  | 'google-drive'
  | 'google-tasks'
  | 'google-contacts'
  | 'weather'
  | 'news'
  | 'maps'
  | 'philips-hue';

const requestIntentPattern = /\b(show|list|check|read|open|what(?:'s| is)|when|find|search|forecast|weather|news|headline|calendar|event|email|mail|drive|file|task|contact|map|where|light|lights|turn|status|next|upcoming|today|tomorrow|create|add|schedule|send|draft|make)\b/i;
const writeIntentPattern = /\b(create|add|schedule|send|draft|turn on|turn off|switch on|switch off|make)\b/i;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getKitTerms(kitId: string) {
  const kit = getMCPKitById(kitId);
  if (!kit) {
    return [] as string[];
  }

  return [...new Set([kit.id, kit.name, kit.id.replace(/-/g, ' '), ...(kit.aliases || [])].map(normalize))];
}

function findReferencedConnection(message: string, connections: MCPConnection[]) {
  const normalizedMessage = normalize(message);

  for (const connection of connections) {
    if (getKitTerms(connection.id).some((term) => term && normalizedMessage.includes(term))) {
      return connection;
    }
  }

  return null;
}

function inferConnectionFromIntent(message: string, connections: MCPConnection[]) {
  const normalizedMessage = normalize(message);
  const connected = connections.filter((connection) => connection.status === 'connected');

  const matchById = (ids: SupportedKitId[], pattern: RegExp) => {
    if (!pattern.test(normalizedMessage)) {
      return null;
    }

    const matches = connected.filter((connection) => ids.includes(connection.id as SupportedKitId));
    return matches.length === 1 ? matches[0] : null;
  };

  return (
    matchById(['google-calendar'], /\b(calendar|event|events|schedule|meeting|appointment)\b/) ||
    matchById(['gmail'], /\b(gmail|email|mail|inbox|message|messages)\b/) ||
    matchById(['google-drive'], /\b(drive|folder|folders|file|files|document|documents)\b/) ||
    matchById(['google-tasks'], /\b(task|tasks|todo|to do|reminder|reminders)\b/) ||
    matchById(['google-contacts'], /\b(contact|contacts|person|people|address book)\b/) ||
    matchById(['weather'], /\b(weather|forecast|temperature)\b/) ||
    matchById(['news'], /\b(news|headline|headlines)\b/) ||
    matchById(['maps'], /\b(map|maps|location|directions|address|where)\b/) ||
    matchById(['philips-hue'], /\b(light|lights|lamp|lamps|hue)\b/) ||
    null
  );
}

function findReferencedKnownKit(message: string) {
  const normalizedMessage = normalize(message);
  for (const kit of MCP_REGISTRY) {
    if (getKitTerms(kit.id).some((term) => term && normalizedMessage.includes(term))) {
      return kit;
    }
  }

  return null;
}

function getConnectionStatusMessage(connection: MCPConnection) {
  if (connection.status === 'pending') {
    return `${connection.name} is only partially configured. Finish the MCP authorization or configuration first.`;
  }

  if (connection.status === 'error') {
    return `${connection.name} is connected with an error state. Reconnect it before asking me to use it.`;
  }

  if (connection.status !== 'connected') {
    return `${connection.name} is not connected yet.`;
  }

  return null;
}

function getGoogleAccessToken(connection: MCPConnection) {
  const token = connection.config?.oauthToken?.trim();
  if (!token) {
    throw new Error(`The ${connection.name} connection does not have a usable OAuth token. Reconnect it from chat or the Connections screen.`);
  }

  return token;
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorBody = await response.json();
      detail = errorBody?.error?.message || errorBody?.message || detail;
    } catch {
      // Keep status text if body is not JSON.
    }
    throw new Error(`${response.status}: ${detail}`);
  }

  return response.json();
}

async function fetchGoogleJson(connection: MCPConnection, url: string) {
  const token = getGoogleAccessToken(connection);
  return fetchJson(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function fetchGoogleJsonWithInit(connection: MCPConnection, url: string, init: RequestInit) {
  const token = getGoogleAccessToken(connection);
  return fetchJson(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

function formatBulletList(title: string, items: string[]) {
  if (items.length === 0) {
    return `${title}\n- No items found.`;
  }

  return `${title}\n${items.map((item) => `- ${item}`).join('\n')}`;
}

function extractLocation(message: string) {
  const inMatch = message.match(/\b(?:in|for|near)\s+([a-z0-9 ,.-]+)/i);
  if (inMatch?.[1]) {
    return inMatch[1].trim();
  }

  return '';
}

function extractQuotedValue(message: string) {
  const quotedMatch = message.match(/"([^"]+)"|'([^']+)'/);
  return quotedMatch?.[1] || quotedMatch?.[2] || '';
}

function extractEmailAddress(message: string) {
  return message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
}

function extractNamedValue(message: string, labels: string[]) {
  for (const label of labels) {
    const regex = new RegExp(`${label}\\s+(?:is\\s+)?(?:\"([^\"]+)\"|'([^']+)'|([^,]+))`, 'i');
    const match = message.match(regex);
    if (match) {
      return (match[1] || match[2] || match[3] || '').trim();
    }
  }

  return '';
}

function parseDateTime(message: string) {
  const now = new Date();
  const baseDate = new Date(now);

  if (/tomorrow/i.test(message)) {
    baseDate.setDate(baseDate.getDate() + 1);
  }

  const isoDate = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoDate) {
    const [year, month, day] = isoDate[1].split('-').map(Number);
    baseDate.setFullYear(year, month - 1, day);
  }

  const timeMatch = message.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2] || '0');
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    }
    if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }

  if (/today|tomorrow|\d{4}-\d{2}-\d{2}/.test(message)) {
    baseDate.setHours(9, 0, 0, 0);
    return baseDate;
  }

  return null;
}

function extractCalendarTitle(message: string) {
  return (
    extractNamedValue(message, ['called', 'named', 'titled']) ||
    extractQuotedValue(message) ||
    extractSearchTopic(message, ['calendar', 'event', 'schedule', 'create', 'add', 'make', 'on', 'at', 'for', 'tomorrow', 'today'])
  );
}

function extractTaskTitle(message: string) {
  return (
    extractNamedValue(message, ['task', 'todo', 'to do', 'called', 'named']) ||
    extractQuotedValue(message) ||
    extractSearchTopic(message, ['task', 'tasks', 'todo', 'to do', 'add', 'create', 'make', 'google'])
  );
}

function extractFolderName(message: string) {
  return (
    extractNamedValue(message, ['folder', 'called', 'named']) ||
    extractQuotedValue(message) ||
    extractSearchTopic(message, ['drive', 'folder', 'create', 'add', 'make', 'google'])
  );
}

function extractEmailParts(message: string) {
  const to = extractEmailAddress(message);
  const subject = extractNamedValue(message, ['subject']) || extractQuotedValue(message);
  const body = extractNamedValue(message, ['body', 'message']) || '';
  return { to, subject, body };
}

function buildRawEmail(to: string, subject: string, body: string) {
  const mime = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(mime)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function extractSearchTopic(message: string, terms: string[]) {
  const normalized = normalize(message);
  let topic = normalized;
  for (const term of terms) {
    topic = topic.replace(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), ' ');
  }
  topic = topic.replace(/\b(show|list|find|search|news|headlines|weather|forecast|map|where|what is|what's|check|open|read|my|the|in|for|near|please)\b/g, ' ');
  return topic.replace(/\s+/g, ' ').trim();
}

async function handleGoogleCalendar(connection: MCPConnection, message: string) {
  if (writeIntentPattern.test(message) && /\b(calendar|event)\b/i.test(message)) {
    const title = extractCalendarTitle(message);
    const start = parseDateTime(message);

    if (!title || !start) {
      return 'To create a calendar event, tell me the title and time. Example: create a calendar event called Team Sync tomorrow at 3pm.';
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const created = await fetchGoogleJsonWithInit(connection, 'https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify({
        summary: title,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }),
    });

    return `Created Google Calendar event ${created.summary || title} for ${start.toLocaleString()}.`;
  }

  const now = new Date();
  const maxResults = /today|tomorrow/i.test(message) ? 20 : 10;
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', now.toISOString());
  url.searchParams.set('maxResults', String(maxResults));

  const data = await fetchGoogleJson(connection, url.toString());
  const items = (data.items || []).slice(0, maxResults).map((event: Record<string, unknown>) => {
    const start = (event.start as Record<string, string> | undefined)?.dateTime || (event.start as Record<string, string> | undefined)?.date;
    const summary = (event.summary as string | undefined) || 'Untitled event';
    return `${summary}${start ? ` — ${start}` : ''}`;
  });

  return formatBulletList('Here are your upcoming Google Calendar events:', items);
}

async function handleGmail(connection: MCPConnection, message: string) {
  if (writeIntentPattern.test(message) && /\b(email|mail|gmail|send)\b/i.test(message)) {
    const { to, subject, body } = extractEmailParts(message);
    if (!to || !subject || !body) {
      return 'To send Gmail from chat, use an explicit format like: send an email to name@example.com subject "Status update" body "We are on track."';
    }

    await fetchGoogleJsonWithInit(connection, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw: buildRawEmail(to, subject, body) }),
    });

    return `Sent your Gmail message to ${to} with subject ${subject}.`;
  }

  const query = /unread/i.test(message) ? 'is:unread' : '';
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('maxResults', '5');
  if (query) {
    url.searchParams.set('q', query);
  }

  const list = await fetchGoogleJson(connection, url.toString());
  const messages = list.messages || [];

  const details = await Promise.all(messages.slice(0, 5).map(async (item: { id: string }) => {
    const detail = await fetchGoogleJson(connection, `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
    const headers = (detail.payload?.headers || []) as Array<{ name: string; value: string }>;
    const subject = headers.find((header) => header.name === 'Subject')?.value || '(no subject)';
    const from = headers.find((header) => header.name === 'From')?.value || 'Unknown sender';
    return `${subject} — ${from}`;
  }));

  return formatBulletList('Here are your recent Gmail messages:', details);
}

async function handleGoogleDrive(connection: MCPConnection, message: string) {
  if (writeIntentPattern.test(message) && /\b(folder|drive)\b/i.test(message)) {
    const folderName = extractFolderName(message);
    if (!folderName) {
      return 'To create a Drive folder, say something like: create a Drive folder called Travel Plans.';
    }

    const created = await fetchGoogleJsonWithInit(connection, 'https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    return `Created Google Drive folder ${created.name || folderName}.`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('pageSize', '10');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,webViewLink)');

  const data = await fetchGoogleJson(connection, url.toString());
  const files = (data.files || []).map((file: Record<string, string>) => `${file.name || 'Untitled'} — ${file.mimeType || 'unknown type'}`);
  return formatBulletList('Here are your recent Google Drive files:', files);
}

async function handleGoogleTasks(connection: MCPConnection, message: string) {
  if (writeIntentPattern.test(message) && /\b(task|todo|to do)\b/i.test(message)) {
    const title = extractTaskTitle(message);
    if (!title) {
      return 'To create a Google Task, say something like: add a task called Submit expense report.';
    }

    const lists = await fetchGoogleJson(connection, 'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=1');
    const listId = lists.items?.[0]?.id;
    if (!listId) {
      throw new Error('No Google Task list is available for this account.');
    }

    const created = await fetchGoogleJsonWithInit(connection, `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });

    return `Created Google Task ${created.title || title}.`;
  }

  const lists = await fetchGoogleJson(connection, 'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=10');
  const items = (lists.items || []).map((list: Record<string, string>) => list.title || 'Untitled task list');
  return formatBulletList('Here are your Google Task lists:', items);
}

async function handleGoogleContacts(connection: MCPConnection) {
  const url = new URL('https://people.googleapis.com/v1/people/me/connections');
  url.searchParams.set('pageSize', '10');
  url.searchParams.set('personFields', 'names,emailAddresses');
  const data = await fetchGoogleJson(connection, url.toString());
  const items = (data.connections || []).map((person: Record<string, unknown>) => {
    const name = ((person.names as Array<Record<string, string>> | undefined)?.[0]?.displayName) || 'Unnamed contact';
    const email = ((person.emailAddresses as Array<Record<string, string>> | undefined)?.[0]?.value) || 'no email';
    return `${name} — ${email}`;
  });
  return formatBulletList('Here are your Google Contacts:', items);
}

async function handleWeather(connection: MCPConnection, message: string) {
  const apiKey = connection.config?.apiKey || connection.config?.values?.apiKey;
  if (!apiKey) {
    throw new Error('The Weather connection is missing an API key. Reconfigure it first.');
  }

  const location = extractLocation(message);
  if (!location) {
    return 'Your Weather MCP connection is ready. Ask me for weather in a location, for example: weather in Boston.';
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('q', location);
  url.searchParams.set('appid', apiKey);
  url.searchParams.set('units', 'imperial');
  const data = await fetchJson(url.toString());
  const temperature = data.main?.temp;
  const condition = data.weather?.[0]?.description;
  const city = data.name || location;
  return `Current weather for ${city}: ${temperature}F and ${condition}.`;
}

async function handleNews(connection: MCPConnection, message: string) {
  const apiKey = connection.config?.apiKey || connection.config?.values?.apiKey;
  if (!apiKey) {
    throw new Error('The News connection is missing an API key. Reconfigure it first.');
  }

  const topic = extractSearchTopic(message, ['news', 'headline', 'headlines']);
  const url = new URL('https://newsapi.org/v2/top-headlines');
  url.searchParams.set('pageSize', '5');
  if (topic) {
    url.searchParams.set('q', topic);
  } else {
    url.searchParams.set('country', 'us');
  }
  url.searchParams.set('apiKey', apiKey);
  const data = await fetchJson(url.toString());
  const items = (data.articles || []).map((article: Record<string, string>) => article.title || 'Untitled article');
  return formatBulletList(topic ? `Top headlines for ${topic}:` : 'Top headlines:', items);
}

async function handleMaps(connection: MCPConnection, message: string) {
  const apiKey = connection.config?.apiKey || connection.config?.values?.apiKey;
  if (!apiKey) {
    throw new Error('The Maps connection is missing an API key. Reconfigure it first.');
  }

  const query = extractSearchTopic(message, ['maps', 'location', 'navigation', 'where']);
  if (!query) {
    return 'Your Maps connection is ready. Ask me to find a place or address, for example: where is 1600 Amphitheatre Parkway.';
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', apiKey);
  const data = await fetchJson(url.toString());
  const result = data.results?.[0];
  if (!result) {
    return `I could not find a map result for ${query}.`;
  }
  return `Top Maps result for ${query}: ${result.formatted_address}.`;
}

async function handlePhilipsHue(connection: MCPConnection, message: string) {
  const bridgeIp = connection.config?.values?.bridgeIp;
  const apiKey = connection.config?.apiKey || connection.config?.values?.apiKey;
  if (!bridgeIp || !apiKey) {
    throw new Error('The Philips Hue connection needs both a bridge IP and API key. Reconfigure it first.');
  }

  if (/\b(turn on|switch on)\b/i.test(message)) {
    const data = await fetchJson(`https://${bridgeIp}/clip/v2/resource/light`, {
      headers: {
        'hue-application-key': apiKey,
      },
    });

    const firstLight = data.data?.[0];
    const lightId = firstLight?.id;
    if (!lightId) {
      throw new Error('No Philips Hue lights were found.');
    }

    await fetchJson(`https://${bridgeIp}/clip/v2/resource/light/${lightId}`, {
      method: 'PUT',
      headers: {
        'hue-application-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ on: { on: true } }),
    });

    return 'Turned on the first available Philips Hue light.';
  }

  if (/\b(turn off|switch off)\b/i.test(message)) {
    const data = await fetchJson(`https://${bridgeIp}/clip/v2/resource/light`, {
      headers: {
        'hue-application-key': apiKey,
      },
    });

    const firstLight = data.data?.[0];
    const lightId = firstLight?.id;
    if (!lightId) {
      throw new Error('No Philips Hue lights were found.');
    }

    await fetchJson(`https://${bridgeIp}/clip/v2/resource/light/${lightId}`, {
      method: 'PUT',
      headers: {
        'hue-application-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ on: { on: false } }),
    });

    return 'Turned off the first available Philips Hue light.';
  }

  const data = await fetchJson(`https://${bridgeIp}/clip/v2/resource/light`, {
    headers: {
      'hue-application-key': apiKey,
    },
  });

  const lights = (data.data || []).map((light: Record<string, unknown>) => {
    const metadata = light.metadata as Record<string, string> | undefined;
    const on = (light.on as Record<string, boolean> | undefined)?.on;
    return `${metadata?.name || 'Unnamed light'} — ${on ? 'on' : 'off'}`;
  });

  return formatBulletList('Here is the current Philips Hue light status:', lights);
}

const handlers: Partial<Record<SupportedKitId, (connection: MCPConnection, message: string) => Promise<string>>> = {
  'google-calendar': handleGoogleCalendar,
  gmail: handleGmail,
  'google-drive': handleGoogleDrive,
  'google-tasks': handleGoogleTasks,
  'google-contacts': handleGoogleContacts,
  weather: handleWeather,
  news: handleNews,
  maps: handleMaps,
  'philips-hue': handlePhilipsHue,
};

function getSupportedActionHint(connection: MCPConnection) {
  switch (connection.id as SupportedKitId) {
    case 'google-calendar':
      return 'Try: show my upcoming calendar events. You can also say: create a calendar event called Team Sync tomorrow at 3pm.';
    case 'gmail':
      return 'Try: show my unread Gmail messages. You can also say: send an email to name@example.com subject "Status update" body "We are on track."';
    case 'google-drive':
      return 'Try: show my recent Drive files. You can also say: create a Drive folder called Travel Plans.';
    case 'google-tasks':
      return 'Try: show my task lists. You can also say: add a task called Submit expense report.';
    case 'google-contacts':
      return 'Try: show my contacts.';
    case 'weather':
      return 'Try: weather in Seattle. This integration is read-only.';
    case 'news':
      return 'Try: top news about AI. This integration is read-only.';
    case 'maps':
      return 'Try: where is Times Square. This integration is read-only.';
    case 'philips-hue':
      return 'Try: show my light status. You can also say: turn on the lights or turn off the lights.';
    default:
      return `The ${connection.name} MCP connection is active, but this chat runtime does not have a handler for it yet.`;
  }
}

export async function handleMCPChatRequest(message: string, connections: MCPConnection[]) {
  const referencedConnection = findReferencedConnection(message, connections) || inferConnectionFromIntent(message, connections);
  if (!referencedConnection) {
    const referencedKit = findReferencedKnownKit(message);
    if (referencedKit && requestIntentPattern.test(message)) {
      return `${referencedKit.name} is not connected right now. Ask me to connect it first.`;
    }
    return null;
  }

  const statusMessage = getConnectionStatusMessage(referencedConnection);
  if (statusMessage) {
    return statusMessage;
  }

  const handler = handlers[referencedConnection.id as SupportedKitId];
  if (!handler) {
    return getSupportedActionHint(referencedConnection);
  }

  if (!requestIntentPattern.test(message)) {
    return `I can use ${referencedConnection.name}. ${getSupportedActionHint(referencedConnection)}`;
  }

  try {
    return await handler(referencedConnection, message);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown MCP error.';
    return `I could not use ${referencedConnection.name}. ${detail}`;
  }
}