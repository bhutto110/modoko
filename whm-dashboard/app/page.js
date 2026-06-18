import { getServers } from '@/lib/db';
import { getServiceStatus, getSystemInfo, getDiskUsage } from '@/lib/whm';
import ServerStatusCard from '@/components/ServerStatusCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const servers = await getServers();

  const serverData = await Promise.all(
    servers.map(async (server) => {
      try {
        const [services, system, disks] = await Promise.allSettled([
          getServiceStatus(server.host, server.token),
          getSystemInfo(server.host, server.token),
          getDiskUsage(server.host, server.token)
        ]);

        return {
          ...server,
          services: services.status === 'fulfilled' ? services.value : [],
          system: system.status === 'fulfilled' ? system.value : {},
          disks: disks.status === 'fulfilled' ? disks.value : [],
          online: services.status === 'fulfilled' && services.value.length > 0
        };
      } catch (error) {
        return {
          ...server,
          services: [],
          system: {},
          disks: [],
          online: false,
          error: error.message
        };
      }
    })
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🔧 WHM Server Dashboard</h1>
              <p className="text-blue-100 mt-1">Real-time server monitoring</p>
            </div>
            <div className="flex gap-3">
              <span className="bg-white/20 px-4 py-2 rounded-lg text-sm">
                {serverData.filter(s => s.online).length} / {serverData.length} Online
              </span>
              <a 
                href="/login" 
                className="bg-white text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
              >
                Admin Login
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Server Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {serverData.map((server) => (
            <ServerStatusCard key={server.id} server={server} />
          ))}
        </div>

        {serverData.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No servers configured yet.</p>
            <a href="/login" className="text-blue-600 hover:underline mt-2 inline-block">
              Login to add servers
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>WHM Server Dashboard • Auto-refreshes every 5 minutes</p>
        </div>
      </footer>
    </main>
  );
}
