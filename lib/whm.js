// Use PHP proxy instead of direct WHM connection
const PROXY_URL = process.env.PROXY_URL || '';

export async function fetchWHM(host, token, endpoint) {
  if (!PROXY_URL) {
    throw new Error('PROXY_URL not configured');
  }

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ host, token, endpoint }),
      cache: 'no-store'
    });

    const text = await response.text();

    console.log(`[WHM ${endpoint}] Status: ${response.status}`);
    console.log(`[WHM ${endpoint}] Raw: ${text.substring(0, 500)}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
    }

    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error(`[WHM ${endpoint}] Error:`, error.message);
    throw error;
  }
}

export async function getServiceStatus(host, token) {
  const data = await fetchWHM(host, token, 'servicestatus');

  if (data.data?.services) return data.data.services;
  if (data.result?.data?.services) return data.result.data.services;
  if (Array.isArray(data.data)) return data.data;

  console.log('[getServiceStatus] Format:', JSON.stringify(data).substring(0, 300));
  return [];
}

export async function getSystemInfo(host, token) {
  const info = {
    load1: '', load5: '', load15: '', cpus: '',
    memoryPercent: '', memoryUsed: '', memoryTotal: '',
    swapPercent: '', swapUsed: '', swapTotal: '',
    uptime: ''
  };

  try {
    const load = await fetchWHM(host, token, 'loadavg');
    if (load.data) {
      info.load1 = formatLoad(load.data.one || load.data['1'] || load.data.load1);
      info.load5 = formatLoad(load.data.five || load.data['5'] || load.data.load5);
      info.load15 = formatLoad(load.data.fifteen || load.data['15'] || load.data.load15);
      info.cpus = load.data.cpus || load.data.cpucount || 'N/A';
    }
  } catch (e) {}

  try {
    const stats = await fetchWHM(host, token, 'system_stats');
    if (stats.data) {
      const d = stats.data;
      info.memoryUsed = formatBytes(d.memory_used || d.memused);
      info.memoryTotal = formatBytes(d.memory_total || d.memtotal);
      info.memoryPercent = calculatePercent(d.memory_used, d.memory_total);
      info.swapUsed = formatBytes(d.swap_used || d.swapused);
      info.swapTotal = formatBytes(d.swap_total || d.swaptotal);
      info.swapPercent = calculatePercent(d.swap_used, d.swap_total);
      info.uptime = formatUptime(d.uptime);
    }
  } catch (e) {}

  if (!info.memoryUsed) {
    try {
      const status = await fetchWHM(host, token, 'server_status');
      if (status.data) {
        const d = status.data;
        info.memoryUsed = formatBytes(d.memoryused);
        info.memoryTotal = formatBytes(d.memorytotal);
        info.memoryPercent = d.memorypercent || calculatePercent(d.memoryused, d.memorytotal);
        info.swapUsed = formatBytes(d.swapused);
        info.swapTotal = formatBytes(d.swaptotal);
        info.swapPercent = d.swappercent || calculatePercent(d.swapused, d.swaptotal);
      }
    } catch (e) {}
  }

  return info;
}

export async function getDiskUsage(host, token) {
  const endpoints = ['diskusage', 'disk_usage', 'df'];

  for (const ep of endpoints) {
    try {
      const data = await fetchWHM(host, token, ep);
      if (data.data?.disks) return data.data.disks;
      if (Array.isArray(data.data)) return data.data;
      if (data.result?.data?.disks) return data.result.data.disks;
    } catch (e) {}
  }
  return [];
}

function formatLoad(value) {
  if (!value && value !== 0) return 'N/A';
  return parseFloat(value).toFixed(2);
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return 'N/A';
  const num = parseFloat(bytes);
  if (isNaN(num)) return bytes.toString();
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0, size = num;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(2)} ${units[i]}`;
}

function calculatePercent(used, total) {
  const u = parseFloat(used), t = parseFloat(total);
  if (!u || !t || t === 0) return 'N/A';
  return ((u / t) * 100).toFixed(2) + '%';
}

function formatUptime(seconds) {
  if (!seconds) return 'N/A';
  const s = parseInt(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
