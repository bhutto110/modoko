import { NextResponse } from 'next/server';
import { getServerById } from '@/lib/db';
import { getServiceStatus, getSystemInfo, getDiskUsage } from '@/lib/whm';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
  }

  const server = await getServerById(id);
  if (!server) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  try {
    const [services, system, disks] = await Promise.allSettled([
      getServiceStatus(server.host, server.token),
      getSystemInfo(server.host, server.token),
      getDiskUsage(server.host, server.token)
    ]);

    return NextResponse.json({
      server: server.name,
      services: services.status === 'fulfilled' ? services.value : [],
      system: system.status === 'fulfilled' ? system.value : {},
      disks: disks.status === 'fulfilled' ? disks.value : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
