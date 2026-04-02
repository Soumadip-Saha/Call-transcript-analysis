import React, { useMemo, useState } from 'react';
import { FlattenedIntent } from '../lib/data';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, Search } from 'lucide-react';

interface DashboardProps {
  data: FlattenedIntent[];
  topN: number;
}

const COLORS = ['#EF553B', '#636EFA', '#00CC96', '#AB63FA', '#FFA15A', '#19D3F3', '#FF6692', '#B6E880'];
const REASON_COLORS: Record<string, string> = {
  Complaint: '#EF553B',
  Request: '#636EFA',
  Inquiry: '#00CC96',
};

export default function Dashboard({ data, topN }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // KPIs
  const totalCalls = useMemo(() => new Set(data.map((d) => d.call_id)).size, [data]);
  const totalIntents = data.length;
  const complaints = data.filter((d) => d.reason === 'Complaint').length;
  const requests = data.filter((d) => d.reason === 'Request').length;

  // Reason Distribution Data
  const reasonData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      acc[curr.reason] = (acc[curr.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  // L1 Categories by Reason Data
  const l1ReasonData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      if (!acc[curr.l1]) acc[curr.l1] = {};
      acc[curr.l1][curr.reason] = (acc[curr.l1][curr.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(grouped).map(([l1, reasons]) => ({
      l1,
      ...reasons,
    }));
  }, [data]);

  const uniqueReasonsInL1 = useMemo(() => {
    const reasons = new Set<string>();
    data.forEach(d => reasons.add(d.reason));
    return Array.from(reasons);
  }, [data]);

  // Heatmap Data (L1 x Reason Density %)
  const heatmapData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      if (!acc[curr.l1]) acc[curr.l1] = {};
      acc[curr.l1][curr.reason] = (acc[curr.l1][curr.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    const l1s = Array.from(new Set(data.map(d => d.l1))).sort();
    const reasons = Array.from(new Set(data.map(d => d.reason))).sort();

    return { l1s, reasons, grouped };
  }, [data]);

  // Top N L2 Issues Data
  const topL2Data = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      acc[curr.l2] = (acc[curr.l2] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([l2_issue, count]) => ({ l2_issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN)
      .sort((a, b) => a.count - b.count); // Ascending for horizontal bar chart
  }, [data, topN]);

  // Table Data
  const tableData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(
      (d) =>
        d.transcript.toLowerCase().includes(lowerSearch) ||
        d.evidence.toLowerCase().includes(lowerSearch)
    );
  }, [data, searchTerm]);

  const handleExport = () => {
    const headers = ['call_id', 'reason', 'l1', 'l2', 'classification_status', 'evidence', 'transcript'];
    const csvContent = [
      headers.join(','),
      ...tableData.map(row => 
        headers.map(header => {
          const val = row[header as keyof FlattenedIntent] || '';
          // Escape quotes and wrap in quotes if contains comma
          const strVal = String(val).replace(/"/g, '""');
          return `"${strVal}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'filtered_call_intelligence.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHeatmapColor = (percentage: number) => {
    // Simple Reds color scale
    if (percentage === 0) return 'bg-gray-50 text-gray-400';
    if (percentage < 5) return 'bg-red-100 text-red-900';
    if (percentage < 15) return 'bg-red-200 text-red-900';
    if (percentage < 30) return 'bg-red-300 text-red-900';
    if (percentage < 50) return 'bg-red-400 text-white';
    if (percentage < 70) return 'bg-red-500 text-white';
    return 'bg-red-600 text-white';
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Unique Calls</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalCalls}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Intents</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalIntents}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Complaints</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-gray-900">{complaints}</p>
            <span className="text-sm font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
              {totalIntents ? ((complaints / totalIntents) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Requests</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-gray-900">{requests}</p>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {totalIntents ? ((requests / totalIntents) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reason Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REASON_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">L1 Categories by Reason</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={l1ReasonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="l1" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                {uniqueReasonsInL1.map((reason, index) => (
                  <Bar key={reason} dataKey={reason} fill={REASON_COLORS[reason] || COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Heatmap: L1 × Reason (Density %)</h3>
          <div className="min-w-[400px]">
            <div className="flex">
              <div className="w-32 shrink-0"></div>
              {heatmapData.reasons.map(reason => (
                <div key={reason} className="flex-1 text-center text-xs font-semibold text-gray-500 pb-2 truncate px-1">
                  {reason}
                </div>
              ))}
            </div>
            {heatmapData.l1s.map(l1 => (
              <div key={l1} className="flex items-center mb-1">
                <div className="w-32 shrink-0 text-xs font-medium text-gray-700 truncate pr-2 text-right">
                  {l1}
                </div>
                {heatmapData.reasons.map(reason => {
                  const count = heatmapData.grouped[l1]?.[reason] || 0;
                  const percentage = totalIntents ? (count / totalIntents) * 100 : 0;
                  return (
                    <div key={`${l1}-${reason}`} className="flex-1 px-1">
                      <div 
                        className={`h-10 rounded flex items-center justify-center text-xs font-medium ${getHeatmapColor(percentage)}`}
                        title={`${l1} - ${reason}: ${percentage.toFixed(1)}% (${count})`}
                      >
                        {percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top {topN} L2 Issues</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topL2Data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="l2_issue" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 11 }} width={90} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Drill-down: Detailed Records</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transcript or evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Call ID</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">L1</th>
                <th className="px-6 py-3">L2</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 min-w-[200px]">Evidence</th>
                <th className="px-6 py-3 min-w-[300px]">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableData.slice(0, 100).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.call_id}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      row.reason === 'Complaint' ? 'bg-red-100 text-red-800' :
                      row.reason === 'Request' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {row.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4">{row.l1}</td>
                  <td className="px-6 py-4">{row.l2}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      row.classification_status === 'success' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {row.classification_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="line-clamp-2" title={row.evidence}>{row.evidence}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="line-clamp-2" title={row.transcript}>{row.transcript}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tableData.length > 100 && (
            <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
              Showing first 100 of {tableData.length} records. Export to view all.
            </div>
          )}
          {tableData.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No records found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
