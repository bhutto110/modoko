import { NextResponse } from 'next/server';
import { getServers, saveServer, deleteServer } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const servers = await getServers();
  // Don't return tokens to client
  const safeServers = servers.map(s => ({
    id: s.id,
    name: s.name,
    host: s.host,
    // token is hidden
  }));

  return NextResponse.json(safeServers);
}

export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const server = await request.json();
    const saved = await saveServer(server);
    return NextResponse.json({ id: saved.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  await deleteServer(id);
  return NextResponse.json({ success: true });
}
