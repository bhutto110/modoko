import { kv } from '@vercel/kv';

// Fallback to memory if KV not available
const memoryStore = new Map();

export async function getServers() {
  try {
    const servers = await kv.get('servers');
    return servers || [];
  } catch {
    return memoryStore.get('servers') || [];
  }
}

export async function saveServer(server) {
  const servers = await getServers();
  const existing = servers.findIndex(s => s.id === server.id);

  if (existing >= 0) {
    servers[existing] = server;
  } else {
    server.id = server.id || Date.now().toString();
    servers.push(server);
  }

  try {
    await kv.set('servers', servers);
  } catch {
    memoryStore.set('servers', servers);
  }

  return server;
}

export async function deleteServer(id) {
  const servers = await getServers();
  const filtered = servers.filter(s => s.id !== id);

  try {
    await kv.set('servers', filtered);
  } catch {
    memoryStore.set('servers', filtered);
  }
}

export async function getServerById(id) {
  const servers = await getServers();
  return servers.find(s => s.id === id);
}
