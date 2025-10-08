'use client';
import { useEffect, useState, useRef } from 'react';

interface CrimeEntry {
  date: string;
  type: string;
  location: string;
  time: string;
  status: string;
}

type SortKey = keyof CrimeEntry;

export default function Home() {
  const [data, setData] = useState<CrimeEntry[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(50);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/crime-data.json')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) setData(json);
        else console.error('Invalid data format');
      })
      .catch(console.error);
  }, []);

  const sortedData = [...data].sort((a, b) => {
    const aVal = (a?.[sortKey] ?? '').toString().toLowerCase();
    const bVal = (b?.[sortKey] ?? '').toString().toLowerCase();
    return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Lazy loading: load more when user scrolls near bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 50, data.length));
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [data.length]);

  const visibleData = sortedData.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-gray-900 text-white px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Boise State Crime Tracker</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">Total Incidents This Month</div>
        <div className="bg-gray-800 p-4 rounded-lg col-span-2">This Week&apos;s Summary (AI)</div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">Incident Types (Pie Chart)</div>
        <div className="bg-gray-800 p-4 rounded-lg">Monthly Trends (Bar Chart)</div>
        <div className="bg-gray-800 p-4 rounded-lg">Heatmap (Location)</div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 p-4 rounded-lg mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Incident Log</h2>
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-gray-400">
            <tr>
              {['date', 'type', 'location', 'time', 'status'].map((key) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key as SortKey)}
                  className="cursor-pointer px-3 py-2 hover:text-white whitespace-nowrap"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  {sortKey === key && (sortAsc ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((entry, idx) => (
              <tr key={idx} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="px-3 py-2">{entry.date || '—'}</td>
                <td className="px-3 py-2">{entry.type || '—'}</td>
                <td className="px-3 py-2">{entry.location || '—'}</td>
                <td className="px-3 py-2">{entry.time || '—'}</td>
                <td className="px-3 py-2">{entry.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Lazy Load Trigger */}
        {visibleCount < data.length && (
          <div ref={loaderRef} className="text-center py-4 text-gray-400">
            Loading more incidents...
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-sm text-gray-500 text-center pt-6 border-t border-gray-700">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p>This information may not be 100% accurate. Always refer to official sources.</p>
      </footer>
    </main>
  );
}