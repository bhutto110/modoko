import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const SERVERS_KEY = 'whm:servers';

export async function getServers() {
  try {
    const servers = await redis.get(SERVERS_KEY);
    return servers || [];
  } catch (error) {
    console.error('Error getting servers:', error);
    return [];
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

  await redis.set(SERVERS_KEY, servers);
  return server;
}

export async function deleteServer(id) {
  const servers = await getServers();
  const filtered = servers.filter(s => s.id !== id);
  await redis.set(SERVERS_KEY, filtered);
}

export async function getServerById(id) {
  const servers = await getServers();
  return servers.find(s => s.id === id);
}
