"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [crimeData, setCrimeData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/crime-data.json?_t=" + new Date().getTime()); // Bypass cache
      const data = await res.json();
      setCrimeData(data);
      setLastUpdated(new Date().toLocaleString());
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Boise State Crime Tracker</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">Total Incidents This Month: {crimeData.length}</div>
        <div className="bg-gray-800 p-4 rounded-lg col-span-2">This Week's Summary (AI)</div>
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
        <div className="space-y-1 text-sm">
          {crimeData.map((entry, index) => (
            <div key={index} className="text-gray-300">
              {entry.date} | {entry.type} | {entry.location} | {entry.time} | {entry.status}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-sm text-gray-500 text-center pt-6 border-t border-gray-700">
        <p>Last updated: {lastUpdated}</p>
        <p>This information may not be 100% accurate. Always refer to official sources.</p>
      </footer>
    </main>
  );
}