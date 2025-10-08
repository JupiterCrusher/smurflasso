'use client';
import { useEffect, useState } from 'react';

interface CrimeEntry {
  date: string;
  type: string;
  location: string;
  time: string;
  status: string;
}

export default function Home() {
  const [data, setData] = useState<CrimeEntry[]>([]);

  useEffect(() => {
    fetch('/crime-data.json')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

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
      <div className="bg-gray-800 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Incident Log</h2>
        <p className="text-sm text-gray-400 mb-2">Date | Type | Location | Time | Status</p>
        <div className="space-y-1">
          {data.map((entry, idx) => (
            <p key={idx} className="text-sm">
              {entry.date} | {entry.type} | {entry.location} | {entry.time} | {entry.status}
            </p>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-sm text-gray-500 text-center pt-6 border-t border-gray-700">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p>This information may not be 100% accurate. Always refer to official sources.</p>
      </footer>
    </main>
  );
}