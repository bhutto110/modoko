'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Server, Activity, HardDrive, Cpu, MemoryStick, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const COLORS = ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#9aa0a6', '#673ab7'];

export default function ServerStatusCard({ server }) {
  const [expanded, setExpanded] = useState(false);

  const { name, host, online, services, system, disks, error } = server;

  // Prepare disk data for pie chart
  const diskChartData = disks.map((disk, index) => ({
    name: disk.mount || '/',
    value: parseFloat(disk.used || 0) || parseFloat(disk.total || 0) * (parseInt(disk.usepercent || disk.percent || 0) / 100),
    total: parseFloat(disk.total || disk.size || 0),
    percent: parseInt(disk.usepercent || disk.percent || 0),
    color: COLORS[index % COLORS.length]
  }));

  const upServices = services.filter(s => (s.status || '').toLowerCase() === 'up').length;
  const downServices = services.length - upServices;

  return (
    <div className={`server-card ${!online ? 'border-red-300' : ''}`}>
      {/* Card Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{name}</h2>
              <p className="text-sm text-gray-500">{host}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {online ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <div className="metric-card">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Activity size={16} />
            <span className="text-sm">Services</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {upServices}<span className="text-sm text-gray-400 font-normal">/{services.length}</span>
          </p>
          {downServices > 0 && (
            <p className="text-xs text-red-500 mt-1">{downServices} down</p>
          )}
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Cpu size={16} />
            <span className="text-sm">Load</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{system.load1 || 'N/A'}</p>
          <p className="text-xs text-gray-400 mt-1">{system.cpus} CPUs</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <MemoryStick size={16} />
            <span className="text-sm">Memory</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{system.memoryPercent || 'N/A'}</p>
          <p className="text-xs text-gray-400 mt-1">{system.memoryUsed || ''}</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock size={16} />
            <span className="text-sm">Uptime</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{system.uptime || 'N/A'}</p>
        </div>
      </div>

      {/* Disk Usage Pie Chart */}
      {diskChartData.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-700">Disk Usage</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {diskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    formatBytes(value),
                    `${props.payload.name} (${props.payload.percent}%)`
                  ]}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expandable Details */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 flex items-center justify-between text-gray-600 hover:bg-gray-50 transition"
        >
          <span className="font-medium">Service Details</span>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expanded && (
          <div className="px-6 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-4 py-2 text-left font-medium">Service</th>
                    <th className="px-4 py-2 text-left font-medium">Version</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">PID</th>
                    <th className="px-4 py-2 text-left font-medium">Memory</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc, idx) => (
                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{svc.service || svc.name}</td>
                      <td className="px-4 py-2 text-gray-500">{svc.version || 'N/A'}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          (svc.status || '').toLowerCase() === 'up' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {svc.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{svc.pid || 'N/A'}</td>
                      <td className="px-4 py-2 text-gray-500">{svc.memory || 'N/A'}</td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-400">
                        No service data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return 'N/A';
  const num = parseFloat(bytes);
  if (isNaN(num)) return bytes.toString();
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, size = num;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(2)} ${units[i]}`;
}
