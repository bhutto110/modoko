import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'servers.json');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readData() {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading servers:', error);
    return [];
  }
}

function writeData(servers) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(servers, null, 2));
  } catch (error) {
    console.error('Error writing servers:', error);
  }
}

export async function getServers() {
  return readData();
}

export async function saveServer(server) {
  const servers = readData();
  const existing = servers.findIndex(s => s.id === server.id);

  if (existing >= 0) {
    servers[existing] = server;
  } else {
    server.id = server.id || Date.now().toString();
    servers.push(server);
  }

  writeData(servers);
  return server;
}

export async function deleteServer(id) {
  const servers = readData();
  const filtered = servers.filter(s => s.id !== id);
  writeData(filtered);
}

export async function getServerById(id) {
  const servers = readData();
  return servers.find(s => s.id === id);
}
