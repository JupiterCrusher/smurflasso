'use client';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch('/crime-data.json')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey].toLowerCase();
    const bVal = b[sortKey].toLowerCase();
    return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

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
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400">
            <tr>
              {['date', 'type', 'location', 'time', 'status'].map((key) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key as SortKey)}
                  className="cursor-pointer px-2 py-1 hover:text-white"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  {sortKey === key && (sortAsc ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((entry, idx) => (
              <tr key={idx} className="border-t border-gray-700">
                <td className="px-2 py-1">{entry.date}</td>
                <td className="px-2 py-1">{entry.type}</td>
                <td className="px-2 py-1">{entry.location}</td>
                <td className="px-2 py-1">{entry.time}</td>
                <td className="px-2 py-1">{entry.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <footer className="text-sm text-gray-500 text-center pt-6 border-t border-gray-700">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p>This information may not be 100% accurate. Always refer to official sources.</p>
      </footer>
    </main>
  );
}