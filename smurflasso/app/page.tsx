'use client';
import { useEffect, useState, useRef, useMemo } from 'react';

interface CrimeEntry {
  reported: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  case_number: string;
  nature: string;
  disposition: string;
}

type SortKey = keyof CrimeEntry;

export default function Home() {
  const [data, setData] = useState<CrimeEntry[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('reported');
  const [sortAsc, setSortAsc] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Load data
  useEffect(() => {
    fetch('/crime-data.json')
      .then(res => res.json())
      .then(json => Array.isArray(json) && setData(json))
      .catch(console.error);
  }, []);

  // Get unique status list dynamically
  const statuses = useMemo(() => {
    const unique = Array.from(new Set(data.map(d => d.disposition).filter(Boolean)));
    return ['All', ...unique];
  }, [data]);

  // Sorting
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = (a?.[sortKey] ?? '').toString().toLowerCase();
      const bVal = (b?.[sortKey] ?? '').toString().toLowerCase();

      if (sortKey === 'reported' || sortKey.includes('date')) {
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        return sortAsc ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }

      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return sorted;
  }, [data, sortKey, sortAsc]);

  // Filter + Search
  const filteredData = useMemo(() => {
    return sortedData.filter(entry => {
      const matchesSearch =
        entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.nature.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.case_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' ||
        entry.disposition.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [sortedData, searchTerm, statusFilter]);

  const visibleData = filteredData.slice(0, visibleCount);

  // ✅ Fixed lazy loading cleanup
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => Math.min(prev + 50, filteredData.length));
      }
    });

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
      observer.disconnect();
    };
  }, [filteredData.length]);

  // Helpers
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-600';
    const lower = status.toLowerCase();
    if (lower.includes('open')) return 'bg-gradient-pulse';
    if (lower.includes('closed')) return 'bg-green-600/50 border border-green-500/50';
    if (lower.includes('referred')) return 'bg-blue-600/40 border border-blue-400/40';
    if (lower.includes('pending')) return 'bg-yellow-600/40 border border-yellow-400/40';
    return 'bg-gray-600/40 border border-gray-400/20';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white px-6 py-8">
      <style>{`
        @keyframes gradientPulse {
          0%, 100% { background-color: #ef4444; }
          50% { background-color: #f87171; }
        }
        .bg-gradient-pulse {
          background-color: #ef4444;
          animation: gradientPulse 2s ease-in-out infinite;
          border: 1px solid #f87171;
        }
      `}</style>

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-1 tracking-tight">Boise State Crime Tracker</h1>
        <p className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleString()} • This data may not be 100% accurate.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/70 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm text-gray-400 mb-1">Total Incidents</h3>
          <p className="text-2xl font-semibold text-orange-400">{data.length}</p>
        </div>
        <div className="bg-gray-800/70 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm text-gray-400 mb-1">This Month</h3>
          <p className="text-2xl font-semibold text-orange-400">
            {
              data.filter(d => {
                const date = new Date(d.reported);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length
            }
          </p>
        </div>
        <div className="bg-gray-800/70 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm text-gray-400 mb-1">AI Summary (Soon)</h3>
          <p className="text-orange-400/60 italic">Coming soon...</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        <input
          type="text"
          placeholder="Search by location, crime, or case number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-2/3 bg-gray-800/70 text-white px-3 py-2 rounded-md outline-none focus:ring focus:ring-orange-400/50 placeholder-gray-500"
        />
        <div className="flex flex-wrap justify-end gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-sm transition-all border ${
                statusFilter === s
                  ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_8px_rgba(255,165,0,0.6)]'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700 mb-8 overflow-x-auto backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 border-l-4 border-orange-500 pl-2">Incident Log</h2>
        <table className="w-full text-sm text-left border-collapse table-fixed">
          <thead className="sticky top-0 bg-gray-900/95 text-gray-400 border-b border-gray-700 backdrop-blur-md">
            <tr>
              {[
                { key: 'reported', label: 'Reported' },
                { key: 'nature', label: 'Crime' },
                { key: 'location', label: 'Location' },
                { key: 'start_time', label: 'Start' },
                { key: 'end_time', label: 'End' },
                { key: 'disposition', label: 'Status' },
                { key: 'case_number', label: 'Case #' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key as SortKey)}
                  className="cursor-pointer px-3 py-2 hover:text-white select-none whitespace-nowrap"
                  style={{ width: '14.28%' }}
                >
                  {label}
                  {sortKey === key && (sortAsc ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((entry, idx) => (
              <tr
                key={idx}
                className="border-t border-gray-700 hover:bg-gray-700/40 transition-all"
              >
                <td className="px-3 py-2">{entry.reported || '—'}</td>
                <td className="px-3 py-2">{entry.nature || '—'}</td>
                <td className="px-3 py-2">{entry.location || '—'}</td>
                <td className="px-3 py-2">{entry.start_time || '—'}</td>
                <td className="px-3 py-2">{entry.end_time || '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(
                      entry.disposition
                    )}`}
                  >
                    {entry.disposition || '—'}
                  </span>
                </td>
                <td className="px-3 py-2">{entry.case_number || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {visibleCount < filteredData.length && (
          <div ref={loaderRef} className="text-center py-4 text-gray-400">
            Loading more incidents...
          </div>
        )}
      </div>
    </main>
  );
}