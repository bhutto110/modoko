'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Server, LogOut, RefreshCw, Check, X } from 'lucide-react';

export default function DashboardPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', host: '', token: '' });
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchServers();
  }, []);

  async function fetchServers() {
    try {
      const res = await fetch('/api/servers');
      if (res.ok) {
        const data = await res.json();
        setServers(data);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddServer(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newServer)
      });

      if (res.ok) {
        setMessage('Server added successfully!');
        setNewServer({ name: '', host: '', token: '' });
        setShowAddForm(false);
        fetchServers();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to add server');
      }
    } catch (error) {
      setMessage('Error adding server');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this server?')) return;

    try {
      const res = await fetch(`/api/servers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Server deleted');
        fetchServers();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error deleting server');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }

  async function testConnection(server) {
    try {
      const res = await fetch(`/api/status?id=${server.id}`);
      const data = await res.json();
      alert(data.error ? `Failed: ${data.error}` : `Success! ${data.services?.length || 0} services found`);
    } catch (error) {
      alert('Connection test failed');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Server className="text-blue-600" size={28} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Server Management</h1>
              <p className="text-sm text-gray-500">{servers.length} servers configured</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a 
              href="/" 
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              View Dashboard
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg ${
            message.includes('success') || message.includes('deleted') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Add Server Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mb-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Server
        </button>

        {/* Add Server Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Server</h2>
            <form onSubmit={handleAddServer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
                  <input
                    type="text"
                    value={newServer.name}
                    onChange={(e) => setNewServer({...newServer, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Server-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WHM Host</label>
                  <input
                    type="text"
                    value={newServer.host}
                    onChange={(e) => setNewServer({...newServer, host: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., premium-king.1onhost.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                  <input
                    type="password"
                    value={newServer.token}
                    onChange={(e) => setNewServer({...newServer, token: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="WHM API Token"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Save Server
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Servers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Host</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {servers.map((server) => (
                <tr key={server.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{server.name}</td>
                  <td className="px-6 py-4 text-gray-600">{server.host}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => testConnection(server)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm"
                      >
                        <RefreshCw size={14} />
                        Test
                      </button>
                      <button
                        onClick={() => handleDelete(server.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {servers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                    No servers configured. Add your first server above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
