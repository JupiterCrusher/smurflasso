'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import CampusHeatmap from './campus-heatmap';

ChartJS.register(
  ArcElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
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
type DateRange = 'all' | '30' | '90' | '365';
type IconName =
  | 'calendar'
  | 'chart'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'clock'
  | 'close'
  | 'document'
  | 'download'
  | 'external'
  | 'refresh'
  | 'search'
  | 'shield'
  | 'tag'
  | 'warning';

const CATEGORIES = [
  'Alcohol / DUI',
  'Drugs',
  'Assault / Violence',
  'Sexual Assault',
  'Vandalism / Property Damage',
  'Theft / Burglary',
  'Hit & Run / Vehicle',
  'Trespassing / Harassment',
  'Weapons / Threats',
  'Other / Miscellaneous',
] as const;

const CATEGORY_COLORS = [
  '#f45b16',
  '#1769e0',
  '#3c9ee8',
  '#3197a2',
  '#6f88a0',
  '#2d73b6',
  '#ef9a35',
  '#6fc1ee',
  '#aabbd0',
  '#425a73',
];

const TABLE_COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: 'reported', label: 'Reported' },
  { key: 'nature', label: 'Incident' },
  { key: 'location', label: 'Location' },
  { key: 'start', label: 'Start' },
  { key: 'end', label: 'End' },
  { key: 'disposition', label: 'Status' },
  { key: 'case_number', label: 'Case #' },
];

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' });
const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function categorizeNature(nature: string) {
  const normalized = nature.toLowerCase();
  if (
    normalized.includes('alcohol') ||
    normalized.includes('minor') ||
    normalized.includes('dui') ||
    normalized.includes('open container')
  ) return 'Alcohol / DUI';
  if (
    normalized.includes('drug') ||
    normalized.includes('marijuana') ||
    normalized.includes('narcotic') ||
    normalized.includes('paraphernalia') ||
    normalized.includes('controlled')
  ) return 'Drugs';
  if (
    normalized.includes('assault') ||
    normalized.includes('battery') ||
    normalized.includes('violence') ||
    normalized.includes('fighting')
  ) return 'Assault / Violence';
  if (normalized.includes('rape') || normalized.includes('sexual')) return 'Sexual Assault';
  if (
    normalized.includes('vandalism') ||
    normalized.includes('graffiti') ||
    normalized.includes('malicious')
  ) return 'Vandalism / Property Damage';
  if (
    normalized.includes('theft') ||
    normalized.includes('larceny') ||
    normalized.includes('burglary')
  ) return 'Theft / Burglary';
  if (normalized.includes('hit and run') || normalized.includes('reckless')) return 'Hit & Run / Vehicle';
  if (
    normalized.includes('trespass') ||
    normalized.includes('harass') ||
    normalized.includes('stalk')
  ) return 'Trespassing / Harassment';
  if (
    normalized.includes('weapon') ||
    normalized.includes('threat') ||
    normalized.includes('bribery')
  ) return 'Weapons / Threats';
  return 'Other / Miscellaneous';
}

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    calendar: <><path d="M7 3v3M17 3v3M4 9h16" /><rect x="4" y="5" width="16" height="16" rx="2" /></>,
    chart: <><path d="M5 19v-5M10 19V9M15 19v-8M20 19V5" /></>,
    'chevron-down': <path d="m7 10 5 5 5-5" />,
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
    document: <><path d="M8 3.5h6l4 4V20H6V3.5h2Z" /><path d="M14 3.5V8h4M9 12h6M9 16h4" /></>,
    download: <><path d="M12 3v11m-5-4 5 5 5-5M5 20h14" /></>,
    external: <><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
    refresh: <><path d="M20 12a8 8 0 0 1-14.7 4.4M4 12A8 8 0 0 1 18.7 7.6M18.7 3.5v4.1h-4.1M5.3 20.5v-4.1h4.1" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    shield: <><path d="M12 3.25 19 6v5.2c0 4.2-2.7 7.8-7 9.55-4.3-1.75-7-5.35-7-9.55V6l7-2.75Z" /><path d="m9.5 12 1.7 1.7 3.5-3.7" /></>,
    tag: <><path d="m4 12 8 8 8-8-8-8H4v8Z" /><circle cx="8.5" cy="8.5" r="1" /></>,
    warning: <><path d="m12 4 9 16H3L12 4Z" /><path d="M12 9v4M12 17h.01" /></>,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Metric({
  icon,
  value,
  label,
  detail,
  tone = 'blue',
}: {
  icon: IconName;
  value: string;
  label: string;
  detail: string;
  tone?: 'blue' | 'orange';
}) {
  return (
    <article className={`metric metric--${tone}`}>
      <Icon name={icon} className="metric__icon" />
      <div className="metric__copy">
        <strong className="metric__value">{value}</strong>
        <span className="metric__label">{label}</span>
        <span className="metric__detail">{detail}</span>
      </div>
    </article>
  );
}

function Panel({
  title,
  icon,
  action,
  children,
  className = '',
}: {
  title: string;
  icon?: IconName;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel__header">
        <h2>{icon ? <Icon name={icon} className="panel__title-icon" /> : null}{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Status({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  let tone = 'neutral';
  if (normalized.includes('open')) tone = 'open';
  else if (normalized.includes('arrest') || normalized.includes('citation')) tone = 'resolved';
  else if (normalized.includes('referral')) tone = 'referred';
  return <span className={`status status--${tone}`}>{value || 'Unknown'}</span>;
}

function ChartSelect({ value, label }: { value: string; label: string }) {
  return (
    <button type="button" className="chart-select" aria-label={label}>
      {value}
      <Icon name="chevron-down" className="chart-select__icon" />
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`filter-select ${className}`}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
      <Icon name="chevron-down" className="filter-select__icon" />
    </label>
  );
}

function useCountUp(target: number, duration = 650) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }
    let frameId = 0;
    const startedAt = performance.now();
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setCount(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frameId = window.requestAnimationFrame(update);
    };
    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [duration, target]);

  return count;
}

export default function Home() {
  const [data, setData] = useState<CrimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('reported');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cacheBust = Date.now();
      const dataResponse = await fetch(`/crime-data.json?ts=${cacheBust}`);
      if (!dataResponse.ok) throw new Error('Incident data could not be loaded.');
      const incidentJson = await dataResponse.json();
      if (Array.isArray(incidentJson)) setData(incidentJson);
      setLastUpdated(LAST_UPDATED_FORMATTER.format(new Date()));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const statuses = useMemo(
    () => Array.from(new Set(data.map((entry) => entry.disposition).filter(Boolean))).sort(),
    [data]
  );

  const sortedData = useMemo(() => {
    return data.toSorted((a, b) => {
      const left = String(a[sortKey] || '');
      const right = String(b[sortKey] || '');
      if (sortKey === 'reported' || sortKey === 'start' || sortKey === 'end') {
        const leftTime = parseDate(left)?.getTime() ?? 0;
        const rightTime = parseDate(right)?.getTime() ?? 0;
        return sortAsc ? leftTime - rightTime : rightTime - leftTime;
      }
      return sortAsc ? left.localeCompare(right) : right.localeCompare(left);
    });
  }, [data, sortAsc, sortKey]);

  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const latestDate = data.reduce((latest, entry) => {
      const timestamp = parseDate(entry.reported)?.getTime() ?? 0;
      return Math.max(latest, timestamp);
    }, 0);
    const rangeDays = dateRange === 'all' ? null : Number(dateRange);

    return sortedData.filter((entry) => {
      const reportedAt = parseDate(entry.reported)?.getTime() ?? 0;
      const matchesSearch =
        !normalizedSearch ||
        entry.location.toLowerCase().includes(normalizedSearch) ||
        entry.nature.toLowerCase().includes(normalizedSearch) ||
        entry.case_number.toLowerCase().includes(normalizedSearch);
      const matchesStatus = activeStatus === 'all' || entry.disposition === activeStatus;
      const matchesCategory = activeCategory === 'all' || categorizeNature(entry.nature) === activeCategory;
      const matchesDate =
        !rangeDays ||
        (reportedAt > 0 && latestDate - reportedAt <= rangeDays * 24 * 60 * 60 * 1000);
      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [activeCategory, activeStatus, data, dateRange, searchTerm, sortedData]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, activeStatus, dateRange, pageSize, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleData = filteredData.slice(pageStart, pageStart + pageSize);

  const latestDataDate = useMemo(() => {
    let latest: Date | null = null;
    for (const entry of data) {
      const date = parseDate(entry.reported);
      if (date && (!latest || date > latest)) latest = date;
    }
    return latest;
  }, [data]);

  const countThisMonth = useMemo(() => {
    if (!latestDataDate) return 0;
    return data.filter((entry) => {
      const date = parseDate(entry.reported);
      return date && date.getMonth() === latestDataDate.getMonth() && date.getFullYear() === latestDataDate.getFullYear();
    }).length;
  }, [data, latestDataDate]);

  const openCases = useMemo(
    () => data.filter((entry) => entry.disposition.toLowerCase().includes('open')).length,
    [data]
  );

  const categoryEntries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of data) {
      const category = categorizeNature(entry.nature || 'Unknown');
      counts.set(category, (counts.get(category) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const mostCommon = categoryEntries[0] || ['None', 0];
  const openCasePercent = data.length ? ((openCases / data.length) * 100).toFixed(1) : '0.0';
  const safetyBrief = data.length
    ? `${mostCommon[0]} is the most frequently recorded category (${mostCommon[1]} incidents). ${countThisMonth} incidents were reported in the latest month represented, and ${openCases} cases are currently marked open.`
    : 'Load the incident log to see a summary of the latest available records.';

  const incidentMix = useMemo(() => ({
    labels: categoryEntries.map(([label]) => label),
    datasets: [{
      label: 'Incidents',
      data: categoryEntries.map(([, count]) => count),
      backgroundColor: CATEGORY_COLORS,
      borderColor: '#0a2037',
      borderWidth: 2,
      hoverBorderColor: '#e7f0fa',
      hoverOffset: 3,
    }],
  }), [categoryEntries]);

  const monthlyTrend = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const entry of data) {
      const date = parseDate(entry.reported);
      if (!date) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }
    const months = Array.from(grouped.keys()).sort().slice(-12);
    return {
      labels: months.map((key) => {
        const [year, month] = key.split('-').map(Number);
        return `${MONTH_FORMATTER.format(new Date(year, month - 1))} '${String(year).slice(2)}`;
      }),
      datasets: [{
        label: 'Incidents',
        data: months.map((key) => grouped.get(key) || 0),
        borderColor: '#f45b16',
        backgroundColor: 'rgba(244, 91, 22, 0.08)',
        pointBackgroundColor: '#f45b16',
        pointBorderColor: '#ffe4d5',
        pointBorderWidth: 1.5,
        pointHoverRadius: 5,
        pointRadius: 3.5,
        tension: 0.25,
        fill: true,
      }],
    };
  }, [data]);

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#061526',
        bodyColor: '#dce8f5',
        borderColor: '#2b4a68',
        borderWidth: 1,
        titleColor: '#ffffff',
      },
    },
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#061526',
        bodyColor: '#dce8f5',
        borderColor: '#2b4a68',
        borderWidth: 1,
        titleColor: '#ffffff',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#24415d' },
        ticks: { color: '#91a9bf', font: { size: 11 }, precision: 0 },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: '#91a9bf', font: { size: 11 }, maxRotation: 0 },
      },
    },
  };

  const animatedTotal = useCountUp(data.length);
  const animatedMonth = useCountUp(countThisMonth);

  const toggleSort = (nextKey: SortKey) => {
    if (nextKey === sortKey) setSortAsc((current) => !current);
    else {
      setSortKey(nextKey);
      setSortAsc(true);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveStatus('all');
    setActiveCategory('all');
    setDateRange('all');
  };

  const exportCsv = () => {
    const headers: SortKey[] = ['reported', 'nature', 'location', 'start', 'end', 'disposition', 'case_number'];
    const rows = filteredData.map((entry) =>
      headers.map((header) => `"${String(entry[header] || '').replaceAll('"', '""')}"`).join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campus-incident-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <h1>Campus Incident Explorer</h1>
          <a
            href="https://www.boisestate.edu/publicsafety-security/campus-crime/campus-crime-log/"
            target="_blank"
            rel="noreferrer"
          >
            Official public crime log
            <Icon name="external" className="topbar__external" />
          </a>
        </div>
        <div className="topbar__actions">
          <p className="topbar__updated">
            <Icon name="clock" className="topbar__clock" />
            <span>Last updated:</span> {lastUpdated || 'Loading…'}
          </p>
          <button className="button button--secondary" type="button" onClick={() => void loadData()} disabled={loading}>
            <Icon name="refresh" className={loading ? 'is-spinning' : ''} />
            <span className="button__label">Refresh</span>
          </button>
          <button className="button button--primary" type="button" onClick={exportCsv}>
            <Icon name="download" />
            <span className="button__label">Export CSV</span>
          </button>
        </div>
      </header>

      <div className="dashboard-canvas">
        <section className="metrics-rail" aria-label="Incident overview">
          <Metric icon="document" value={animatedTotal.toLocaleString()} label="Total incidents" detail="All time" />
          <Metric
            icon="calendar"
            value={animatedMonth.toLocaleString()}
            label="This month"
            detail={latestDataDate ? latestDataDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }) : '—'}
          />
          <Metric icon="warning" value={openCases.toLocaleString()} label="Open cases" detail={`${openCasePercent}% of total`} tone="orange" />
          <Metric icon="tag" value={String(mostCommon[0])} label="Most common" detail={`${mostCommon[1]} incidents`} />
        </section>

        <section className="analysis-grid">
          <Panel title="Safety brief" icon="shield" className="safety-panel">
            <div className="safety-panel__body">
              <p>{safetyBrief}</p>
            </div>
          </Panel>

          <Panel title="Incident mix" className="mix-panel">
            <div className="mix-panel__body">
              <div className="doughnut-wrap">
                <Doughnut data={incidentMix} options={doughnutOptions} />
                <div className="doughnut-total"><strong>{data.length}</strong><span>Total</span></div>
              </div>
              <ul className="mix-legend">
                {categoryEntries.slice(0, 6).map(([label, count], index) => (
                  <li key={label}>
                    <span className="mix-legend__dot" style={{ backgroundColor: CATEGORY_COLORS[index] }} />
                    <span className="mix-legend__label" title={label}>{label}</span>
                    <strong>{count}</strong>
                    <span>{data.length ? `(${((count / data.length) * 100).toFixed(1)}%)` : '(0.0%)'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel
            title="Monthly trend"
            action={<ChartSelect value={latestDataDate ? String(latestDataDate.getFullYear()) : 'Year'} label="Change trend year" />}
            className="trend-panel"
          >
            <div className="trend-panel__chart">
              <Line data={monthlyTrend} options={lineOptions} />
            </div>
          </Panel>
        </section>

        <Panel
          title="Campus heatmap"
          action={<span className="map-count">{filteredData.length === data.length ? 'All incidents' : `${filteredData.length} filtered`}</span>}
          className="locations-panel"
        >
          <CampusHeatmap entries={filteredData} />
        </Panel>

        <section className="log-panel">
          <div className="command-bar">
            <label className="search-control">
              <span className="sr-only">Search incidents</span>
              <Icon name="search" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search location, incident, or case #"
              />
              {searchTerm ? (
                <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search">
                  <Icon name="close" />
                </button>
              ) : null}
            </label>
            <FilterSelect label="Status" value={activeStatus} onChange={setActiveStatus}>
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </FilterSelect>
            <FilterSelect label="Category" value={activeCategory} onChange={setActiveCategory}>
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </FilterSelect>
            <FilterSelect label="Date range" value={dateRange} onChange={(value) => setDateRange(value as DateRange)} className="filter-select--date">
              <option value="all">All time</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </FilterSelect>
            <button type="button" className="clear-button" onClick={clearFilters}>
              <Icon name="refresh" />
              Clear filters
            </button>
          </div>

          <div className="log-panel__heading">
            <div>
              <h2>Incident log</h2>
              <span>{filteredData.length} results</span>
            </div>
            <p>
              Showing {filteredData.length ? pageStart + 1 : 0}–{Math.min(pageStart + pageSize, filteredData.length)} of {filteredData.length}
            </p>
          </div>

          <div className="table-scroll" tabIndex={0} aria-label="Scrollable incident records">
            <table>
              <thead>
                <tr>
                  {TABLE_COLUMNS.map(({ key, label }) => (
                    <th key={key} scope="col">
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        aria-label={`Sort by ${label}`}
                        aria-pressed={sortKey === key}
                      >
                        {label}
                        <span className={`sort-indicator ${sortKey === key ? 'is-active' : ''}`}>
                          {sortKey === key ? (sortAsc ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleData.map((entry, index) => (
                  <tr key={`${entry.case_number}-${index}`}>
                    <td className="cell--reported">{entry.reported || '—'}</td>
                    <td className="cell--incident" title={entry.nature}>{entry.nature || '—'}</td>
                    <td className="cell--location" title={entry.location}>{entry.location || '—'}</td>
                    <td>{entry.start || '—'}</td>
                    <td>{entry.end || '—'}</td>
                    <td><Status value={entry.disposition} /></td>
                    <td><a className="case-link" href={`#case-${entry.case_number}`} aria-label={`Case ${entry.case_number}`}>{entry.case_number || '—'}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleData.length ? <p className="empty-state">No incidents match the current filters.</p> : null}
          </div>

          <footer className="table-footer">
            <p>Showing {filteredData.length ? pageStart + 1 : 0} to {Math.min(pageStart + pageSize, filteredData.length)} of {filteredData.length} incidents</p>
            <nav className="pagination" aria-label="Incident log pages">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1} aria-label="Previous page">
                <Icon name="chevron-left" />
              </button>
              <span>Page <strong>{safePage}</strong> of {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage === totalPages} aria-label="Next page">
                <Icon name="chevron-right" />
              </button>
            </nav>
            <label className="page-size">
              <span>Rows per page</span>
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
          </footer>
        </section>

        <footer className="site-footer">
          Unofficial data explorer. Verify records with campus public safety before making decisions.
        </footer>
      </div>
    </main>
  );
}
