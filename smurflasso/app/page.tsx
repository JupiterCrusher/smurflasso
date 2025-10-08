'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import trendlinePlugin from 'chartjs-plugin-trendline';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  trendlinePlugin
);

interface CrimeEntry {
  reported: string;
  start: string;
  end: string;
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
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Load data
  useEffect(() => {
    fetch('/crime-data.json')
      .then(res => res.json())
      .then(json => Array.isArray(json) && setData(json))
      .catch(console.error);
  }, []);

  // Status list
  const statuses = useMemo(
    () => Array.from(new Set(data.map(d => d.disposition).filter(Boolean))),
    [data]
  );

  // Sorting
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = (a?.[sortKey] ?? '').toString().toLowerCase();
      const bVal = (b?.[sortKey] ?? '').toString().toLowerCase();
      if (sortKey === 'reported') {
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        return sortAsc ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return sorted;
  }, [data, sortKey, sortAsc]);

  // Filter + search
  const filteredData = useMemo(() => {
    return sortedData.filter(entry => {
      const matchesSearch =
        entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.nature.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.case_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        activeFilters.length === 0 ||
        activeFilters.some(f => entry.disposition.toLowerCase() === f.toLowerCase());
      return matchesSearch && matchesStatus;
    });
  }, [sortedData, searchTerm, activeFilters]);

  const visibleData = filteredData.slice(0, visibleCount);

  // Lazy load table
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting)
        setVisibleCount(prev => Math.min(prev + 50, filteredData.length));
    });
    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
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
    if (!status) return 'bg-gray-600/60 text-gray-300';
    const lower = status.toLowerCase();
    if (lower.includes('open')) return 'bg-red-600/80 text-white border border-red-500/50';
    if (lower.includes('closed')) return 'bg-green-600/60 text-white border border-green-400/40';
    if (lower.includes('referred')) return 'bg-blue-600/60 text-white border border-blue-400/40';
    if (lower.includes('pending')) return 'bg-yellow-600/60 text-white border border-yellow-400/40';
    return 'bg-gray-700/60 text-gray-200 border border-gray-500/30';
  };

  const countThisMonth = useMemo(() => {
    const now = new Date();
    return data.filter(d => {
      const parsed = new Date(d.reported);
      return (
        !isNaN(parsed.getTime()) &&
        parsed.getMonth() === now.getMonth() &&
        parsed.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [data]);

  // Categorize natures
  const categorizeNature = (nature: string): string => {
    const n = nature.toLowerCase();
    if (n.includes('alcohol') || n.includes('minor') || n.includes('dui') || n.includes('open container'))
      return 'Alcohol / DUI';
    if (n.includes('drug') || n.includes('marijuana') || n.includes('narcotic') || n.includes('paraphernalia') || n.includes('controlled'))
      return 'Drugs';
    if (n.includes('assault') || n.includes('battery') || n.includes('violence') || n.includes('fighting'))
      return 'Assault / Violence';
    if (n.includes('rape') || n.includes('sexual'))
      return 'Sexual Assault';
    if (n.includes('vandalism') || n.includes('graffiti') || n.includes('malicious'))
      return 'Vandalism / Property Damage';
    if (n.includes('theft') || n.includes('larceny') || n.includes('burglary'))
      return 'Theft / Burglary';
    if (n.includes('hit and run') || n.includes('reckless'))
      return 'Hit & Run / Vehicle';
    if (n.includes('trespass') || n.includes('harass') || n.includes('stalk'))
      return 'Trespassing / Harassment';
    if (n.includes('weapon') || n.includes('threat') || n.includes('bribery'))
      return 'Weapons / Threats';
    return 'Other / Miscellaneous';
  };

  // Pie chart (categories)
  const crimeTypeData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      const cat = categorizeNature(curr.nature || 'Unknown');
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return {
      labels: Object.keys(grouped),
      datasets: [
        {
          label: 'Incidents',
          data: Object.values(grouped),
          backgroundColor: [
            '#f87171', '#60a5fa', '#34d399', '#facc15', '#a78bfa',
            '#fb923c', '#f472b6', '#4ade80', '#94a3b8', '#fcd34d'
          ],
        },
      ],
    };
  }, [data]);

  // Monthly trend
  const monthlyTrendData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach(entry => {
      const date = new Date(entry.reported);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(grouped).sort();
    const labels = sortedKeys.map(k => {
      const [year, month] = k.split('-').map(Number);
      return `${new Date(year, month).toLocaleString('default', { month: 'short' })} ${year}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Incidents per Month',
          data: sortedKeys.map(k => grouped[k]),
          backgroundColor: '#fb923c',
          borderRadius: 6,
          trendlineLinear: {
            colorMin: '#ffffff',
            colorMax: '#ffffff',
            lineStyle: 'solid',
            width: 2,
          },
        },
      ],
    };
  }, [data]);

  // --- Render ---
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-850 text-white px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight mb-1">Boise State Crime Tracker</h1>
        <p className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleString()} • Data provided without warranty or guarantee.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Data pulled from{' '}
          <a
            href="https://www.boisestate.edu/publicsafety-security/campus-crime/campus-crime-log/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:underline hover:text-orange-300 transition"
          >
            Boise State University’s official crime log
          </a>.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/80 p-5 rounded-lg border border-gray-700">
          <h3 className="text-sm text-gray-400 mb-1">Total Incidents</h3>
          <p className="text-3xl font-bold text-orange-400">{data.length}</p>
        </div>
        <div className="bg-gray-800/80 p-5 rounded-lg border border-gray-700">
          <h3 className="text-sm text-gray-400 mb-1">This Month</h3>
          <p className="text-3xl font-bold text-orange-400 animate-pulse">{countThisMonth}</p>
        </div>
        <div className="bg-gray-800/80 p-5 rounded-lg border border-gray-700">
          <h3 className="text-sm text-gray-400 mb-1">AI Summary</h3>
          <p className="text-orange-400/60 italic">Coming soon...</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Pie chart */}
        <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700 flex flex-col items-center text-center">
          <h3 className="text-sm text-gray-400 mb-2">Incident Categories</h3>
          <div className="w-3/4 md:w-2/3">
            <Pie
              data={crimeTypeData}
              options={{
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: '#d1d5db', boxWidth: 14, font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-3 max-w-xs leading-relaxed">
            Each slice represents the proportion of reports by type, grouped into broader categories like Theft, Alcohol, or Vandalism.
          </p>
        </div>

        {/* Bar chart */}
        <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm text-gray-400 mb-2">Monthly Trends</h3>
          <Bar
            data={monthlyTrendData}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
              },
            }}
          />
        </div>

        {/* Placeholder */}
        <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700 flex flex-col justify-center items-center">
          <h3 className="text-sm text-gray-400 mb-2">Heatmap</h3>
          <p className="text-gray-500 text-sm italic text-center">Location visualization coming soon.</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <input
            type="text"
            placeholder="Search by location, crime, or case #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-2/3 bg-gray-800/80 border border-gray-700 text-white px-3 py-2 rounded-md outline-none focus:ring focus:ring-orange-400/40 placeholder-gray-500"
          />
          <div className="flex items-center gap-3">
            {activeFilters.length > 0 && (
              <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-400/40 px-2 py-1 rounded-md">
                {activeFilters.length} Filter{activeFilters.length > 1 ? 's' : ''} Active
              </span>
            )}
            <button
              onClick={() => setFiltersOpen(prev => !prev)}
              className="px-4 py-2 bg-gray-800/80 border border-gray-700 text-sm rounded-md hover:bg-gray-700/80 transition"
            >
              {filtersOpen ? 'Hide Filters ▲' : 'Show Filters ▼'}
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-500 ${
            filtersOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            {statuses.map(s => {
              const isActive = activeFilters.includes(s);
              return (
                <button
                  key={s}
                  onClick={() =>
                    setActiveFilters(prev =>
                      isActive ? prev.filter(f => f !== s) : [...prev, s]
                    )
                  }
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_8px_rgba(255,165,0,0.6)]'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600/70'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700 mb-10 backdrop-blur-md">
        <h2 className="text-lg font-semibold mb-3 border-l-4 border-orange-500 pl-2">Incident Log</h2>

        {/* Responsive scroll container */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 bg-gray-900/95 text-gray-400 border-b border-gray-700 backdrop-blur-lg">
              <tr>
                {[
                  { key: 'reported', label: 'Reported' },
                  { key: 'nature', label: 'Crime' },
                  { key: 'location', label: 'Location' },
                  { key: 'start', label: 'Start' },
                  { key: 'end', label: 'End' },
                  { key: 'disposition', label: 'Status' },
                  { key: 'case_number', label: 'Case #' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key as SortKey)}
                    className="cursor-pointer px-3 py-2 hover:text-white select-none whitespace-nowrap text-xs tracking-wide"
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
                  className="border-t border-gray-700 hover:bg-gray-700/40 transition-colors"
                >
                  <td className="px-3 py-2 whitespace-nowrap">{entry.reported || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap sm:whitespace-normal max-w-[200px] truncate">
                    {entry.nature || '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap sm:whitespace-normal max-w-[180px] truncate">
                    {entry.location || '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{entry.start || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{entry.end || '—'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        entry.disposition
                      )}`}
                    >
                      {entry.disposition || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{entry.case_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleCount < filteredData.length && (
          <div ref={loaderRef} className="text-center py-4 text-gray-400 text-sm">
            Loading more incidents...
          </div>
        )}
      </div>
    </main>
  );
}