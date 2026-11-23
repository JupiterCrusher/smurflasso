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
  | 'atlas'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'download'
  | 'external'
  | 'refresh'
  | 'search'
  | 'sort';

const CATEGORIES = [
  'Alcohol / DUI',
  'Drugs',
  'Assault / violence',
  'Sexual assault',
  'Vandalism / property damage',
  'Theft / burglary',
  'Hit & run / vehicle',
  'Trespassing / harassment',
  'Weapons / threats',
  'Other / miscellaneous',
] as const;

const STATUS_LABELS: Record<string, string> = {
  'closed by arrest': 'Closed by arrest',
  'closed by citation': 'Closed by citation',
  'closed by referral': 'Closed by referral',
  'csa report only': 'CSA report only',
};

const CATEGORY_COLORS = [
  '#17483a',
  '#789256',
  '#d47643',
  '#afbf8e',
  '#4a8077',
  '#bd944d',
  '#86865d',
  '#a36954',
  '#5e767e',
  '#939b80',
];

const SOURCE_URL = 'https://www.boisestate.edu/publicsafety-security/campus-crime/campus-crime-log/';
const PUBLISHED_DATA_URL = 'https://raw.githubusercontent.com/JupiterCrusher/smurflasso/main/smurflasso/public/crime-data.json';

const TABLE_COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: 'reported', label: 'Reported' },
  { key: 'nature', label: 'Incident' },
  { key: 'location', label: 'Location' },
  { key: 'start', label: 'Start' },
  { key: 'end', label: 'End' },
  { key: 'disposition', label: 'Status' },
  { key: 'case_number', label: 'Case #' },
];

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
const LATEST_MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const REPORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const chartTooltip = {
  backgroundColor: '#133c31',
  bodyColor: '#f2eee4',
  titleColor: '#ffffff',
  padding: 10,
};
const doughnutOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  cutout: '65%',
  plugins: {
    legend: { display: false },
    tooltip: chartTooltip,
  },
};

const lineOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { display: false },
    tooltip: chartTooltip,
  },
  scales: {
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: '#dedfd4', drawTicks: false },
      ticks: { color: '#616b5c', font: { size: 11 }, precision: 0, padding: 9 },
    },
    x: {
      border: { display: false },
      grid: { color: '#e9e8df', drawTicks: false },
      ticks: { color: '#616b5c', font: { size: 11 }, maxRotation: 0, padding: 8 },
    },
  },
};

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function fetchIncidents(url: string, signal?: AbortSignal): Promise<CrimeEntry[]> {
  const response = await fetch(url, { cache: 'no-cache', signal });
  if (!response.ok) throw new Error(`Could not load incidents (${response.status}).`);

  const records = await response.json();
  if (
    !Array.isArray(records) ||
    !records.length ||
    !records.every((record) => record && TABLE_COLUMNS.every(({ key }) => typeof record[key] === 'string'))
  ) {
    throw new Error('Invalid incident data.');
  }
  return records;
}

function categorizeNature(nature: string): (typeof CATEGORIES)[number] {
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
  ) return 'Assault / violence';
  if (normalized.includes('rape') || normalized.includes('sexual')) return 'Sexual assault';
  if (
    normalized.includes('vandalism') ||
    normalized.includes('graffiti') ||
    normalized.includes('malicious')
  ) return 'Vandalism / property damage';
  if (
    normalized.includes('theft') ||
    normalized.includes('larceny') ||
    normalized.includes('burglary')
  ) return 'Theft / burglary';
  if (normalized.includes('hit and run') || normalized.includes('reckless')) return 'Hit & run / vehicle';
  if (
    normalized.includes('trespass') ||
    normalized.includes('harass') ||
    normalized.includes('stalk')
  ) return 'Trespassing / harassment';
  if (
    normalized.includes('weapon') ||
    normalized.includes('threat') ||
    normalized.includes('bribery')
  ) return 'Weapons / threats';
  return 'Other / miscellaneous';
}

function formatStatus(value: string) {
  const labels = value.split(',').map((part) => part.trim()).filter(Boolean);
  return labels.map((label) => STATUS_LABELS[label.toLowerCase()] ?? label).join(', ') || 'Unknown';
}

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    atlas: <><path d="M2 11c4 1 6-6 11-7 4-.7 5 2 9 2.5M2 15c5 1 6-6 11-7 4-.7 5 2 9 2.5M2 19c6 .7 7-6 11-7s5 2 9 2.5M7 21c2.5-1 3.2-4.4 6-5 4-.9 5 2 9 2.5" /></>,
    'chevron-down': <path d="m7 10 5 5 5-5" />,
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
    download: <><path d="M12 3v11m-5-4 5 5 5-5M5 20h14" /></>,
    external: <path d="M6 18 18 6M8 6h10v10" />,
    refresh: <><path d="M20 12a8 8 0 0 1-14.7 4.4M4 12A8 8 0 0 1 18.7 7.6M18.7 3.5v4.1h-4.1M5.3 20.5v-4.1h4.1" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    sort: <path d="m8 9 4-4 4 4m-8 6 4 4 4-4" />,
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
  value,
  label,
  detail,
  className = '',
}: {
  value: string;
  label: string;
  detail: string;
  className?: string;
}) {
  return (
    <div className={`metric ${className}`}>
      <dt>{label}</dt>
      <dd>
        <strong>{value}</strong>
        <span>{detail}</span>
      </dd>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel__header">
        <h2>{title}</h2>
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
  return <span className={`status status--${tone}`}>{formatStatus(value)}</span>;
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="filter-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
      <Icon name="chevron-down" className="filter-select__icon" />
    </label>
  );
}

export default function Home() {
  const [data, setData] = useState<CrimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('reported');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    try {
      const timeout = AbortSignal.timeout(5000);
      const records = await fetchIncidents(PUBLISHED_DATA_URL, signal ? AbortSignal.any([signal, timeout]) : timeout);
      if (!signal?.aborted) setData(records);
    } catch {
      if (signal?.aborted) return;
      const bundled = await fetchIncidents('/crime-data.json', signal).catch(() => null);
      if (signal?.aborted) return;
      if (bundled) setData((previous) => previous.length ? previous : bundled);
      setLoadError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadData(controller.signal);
    return () => controller.abort();
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
  const hasFilters = Boolean(searchTerm) || activeStatus !== 'all' || activeCategory !== 'all' || dateRange !== 'all';
  const recordCount = (count: number) => count.toLocaleString();

  const incidentMix = useMemo(() => ({
    labels: categoryEntries.map(([label]) => label),
    datasets: [{
      label: 'Incidents',
      data: categoryEntries.map(([, count]) => count),
      backgroundColor: CATEGORY_COLORS,
      borderColor: '#fcfbf7',
      borderWidth: 2,
      hoverOffset: 2,
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
        return MONTH_FORMATTER.format(new Date(year, month - 1));
      }),
      datasets: [{
        label: 'Incidents',
        data: months.map((key) => grouped.get(key) || 0),
        borderColor: '#17483a',
        borderWidth: 2,
        backgroundColor: 'rgba(120, 146, 86, 0.22)',
        pointBackgroundColor: '#17483a',
        pointBorderWidth: 0,
        pointHoverRadius: 6,
        pointRadius: 3.5,
        tension: 0,
        fill: true,
      }],
    };
  }, [data]);

  const toggleSort = (nextKey: SortKey) => {
    if (nextKey === sortKey) setSortAsc((current) => !current);
    else {
      setSortKey(nextKey);
      setSortAsc(true);
    }
  };

  const clearFilters = () => {
    setPage(1);
    setSearchTerm('');
    setActiveStatus('all');
    setActiveCategory('all');
    setDateRange('all');
  };

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
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
    <div className="dashboard-shell">
      <a className="skip-link" href="#incident-log">Skip to incident log</a>
      <main className="dashboard-canvas">
        <div className="workspace">
          <div className="overview">
            <section className="intro" aria-labelledby="page-title">
              <span className="intro__mark"><Icon name="atlas" /></span>
              <h1 id="page-title">Campus incident explorer</h1>
              <p>Public crime log for Boise State University.</p>
              <div className="intro__actions">
                <a className="button button--secondary" href={SOURCE_URL} target="_blank" rel="noreferrer">
                  Official crime log <Icon name="external" />
                </a>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => void loadData()}
                  disabled={loading}
                  aria-label={loading ? 'Refreshing incident data' : 'Refresh'}
                >
                  <Icon name="refresh" className={loading ? 'is-spinning' : ''} /> Refresh
                </button>
              </div>
            </section>

            {loadError ? (
              <p className="load-notice" role="alert">
                {data.length ? 'Could not check for updates. Showing saved records.' : 'Could not load the incident log. Try Refresh to load it again.'}
              </p>
            ) : null}

            <dl className="metrics-rail" aria-label="Incident overview">
              <Metric value={data.length ? recordCount(data.length) : '—'} label="Total incidents" detail="All records" />
              <Metric
                value={latestDataDate ? recordCount(countThisMonth) : '—'}
                label="Latest month"
                detail={latestDataDate ? LATEST_MONTH_FORMATTER.format(latestDataDate) : 'No date available'}
              />
              <Metric
                value={data.length ? recordCount(openCases) : '—'}
                label="Open cases"
                detail={`${openCasePercent}% of total`}
              />
              <Metric
                value={data.length ? String(mostCommon[0]) : '—'}
                label="Most common"
                detail={`${mostCommon[1]} incidents`}
                className="metric--category"
              />
            </dl>

            <section className="safety-brief" aria-labelledby="brief-heading">
              <h2 id="brief-heading">Safety brief</h2>
              <p>
                {data.length ? (
                  <>
                    <strong>{mostCommon[0]}</strong> leads the log with {mostCommon[1]} incidents.
                    {' '}{countThisMonth} {countThisMonth === 1 ? 'incident was' : 'incidents were'} reported in the latest month.
                    {' '}{openCases} cases are marked open.
                  </>
                ) : loading ? 'Loading a summary of the incident log…' : 'No records available to summarize.'}
              </p>
            </section>
          </div>

          <div className="analysis">
            <Panel
              title="Campus heatmap"
              action={
                <span className="panel__note">
                  {hasFilters ? `${recordCount(filteredData.length)} matching ${filteredData.length === 1 ? 'incident' : 'incidents'}` : 'All incidents'}
                </span>
              }
              className="locations-panel"
            >
              <CampusHeatmap entries={filteredData} loading={loading} />
            </Panel>

            <div className="analysis-grid">
              <Panel
                title="Monthly trend"
                action={
                  monthlyTrend.labels.length ? (
                    <span className="panel__note">
                      {monthlyTrend.labels[0]}
                      {monthlyTrend.labels.length > 1 ? ` – ${monthlyTrend.labels.at(-1)}` : ''}
                    </span>
                  ) : null
                }
                className="trend-panel"
              >
                {monthlyTrend.labels.length ? (
                  <div className="trend-panel__chart">
                    <Line
                      data={monthlyTrend}
                      options={lineOptions}
                      aria-label={monthlyTrend.labels.map((label, index) => `${label}: ${monthlyTrend.datasets[0].data[index]} incidents`).join(', ')}
                    />
                  </div>
                ) : <p className="chart-empty">{loading ? 'Loading monthly totals…' : 'No dated records to plot.'}</p>}
              </Panel>

              <Panel title="Incident mix" className="mix-panel">
                {categoryEntries.length ? (
                  <div className="mix-panel__body">
                    <div className="doughnut-wrap">
                      <Doughnut data={incidentMix} options={doughnutOptions} aria-hidden="true" />
                      <div className="doughnut-total">
                        <strong>{recordCount(data.length)}</strong>
                        <span>incidents</span>
                      </div>
                    </div>
                    <ul className="mix-legend" aria-label="Incidents by category">
                      {categoryEntries.map(([label, count], index) => (
                        <li key={label}>
                          <span className="mix-legend__dot" style={{ backgroundColor: CATEGORY_COLORS[index] }} aria-hidden="true" />
                          <span className="mix-legend__label">{label}</span>
                          <strong className="mix-legend__count">{count}</strong>
                          <span className="mix-legend__percent">{((count / data.length) * 100).toFixed(1)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : <p className="chart-empty">{loading ? 'Loading incident categories…' : 'No categories to plot.'}</p>}
              </Panel>
            </div>
          </div>
        </div>

        <section className="log-panel" id="incident-log" aria-labelledby="log-heading">
          <header className="panel__header log-panel__heading">
            <div>
              <h2 id="log-heading">Incident log</h2>
              <span className="panel__note" role="status">
                {recordCount(filteredData.length)} {filteredData.length === 1 ? 'result' : 'results'}
              </span>
            </div>
            <button className="button button--primary" type="button" onClick={exportCsv} disabled={!filteredData.length}>
              <Icon name="download" /> Export CSV
            </button>
          </header>

          <div className="command-bar">
            <div className="search-control">
              <Icon name="search" />
              <label className="sr-only" htmlFor="incident-search">Search incidents</label>
              <input
                id="incident-search"
                type="search"
                value={searchTerm}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search incident, location, or case #"
              />
              {searchTerm ? (
                <button type="button" onClick={() => updateSearch('')} aria-label="Clear search">
                  <Icon name="close" />
                </button>
              ) : null}
            </div>
            <FilterSelect label="Status" value={activeStatus} onChange={(value) => { setActiveStatus(value); setPage(1); }}>
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </FilterSelect>
            <FilterSelect label="Category" value={activeCategory} onChange={(value) => { setActiveCategory(value); setPage(1); }}>
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </FilterSelect>
            <FilterSelect label="Date range" value={dateRange} onChange={(value) => { setDateRange(value as DateRange); setPage(1); }}>
              <option value="all">All time</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </FilterSelect>
            <button type="button" className="clear-button" onClick={clearFilters} disabled={!hasFilters}>
              Clear filters
            </button>
          </div>

          <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable incident records">
            <table>
              <thead>
                <tr>
                  {TABLE_COLUMNS.map(({ key, label }) => (
                    <th key={key} scope="col" aria-sort={sortKey === key ? (sortAsc ? 'ascending' : 'descending') : undefined}>
                      <button type="button" onClick={() => toggleSort(key)} aria-label={`Sort by ${label}`}>
                        {label}
                        <Icon
                          name={sortKey === key ? 'chevron-down' : 'sort'}
                          className={sortKey === key ? `sort-indicator is-active${sortAsc ? ' is-ascending' : ''}` : 'sort-indicator'}
                        />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleData.map((entry, index) => (
                  <tr key={`${entry.case_number}-${index}`}>
                    <td className="cell--date">{entry.reported || '—'}</td>
                    <td className="cell--incident">{entry.nature || '—'}</td>
                    <td className="cell--location">{entry.location || '—'}</td>
                    <td className="cell--date">{entry.start || '—'}</td>
                    <td className="cell--date">{entry.end || '—'}</td>
                    <td><Status value={entry.disposition} /></td>
                    <td className="cell--case">{entry.case_number || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleData.length ? (
              <p className="empty-state">
                {loading ? 'Loading incident records…' : loadError && !data.length ? 'Incident records are unavailable.' : hasFilters ? 'No incidents match these filters.' : 'The incident log is empty.'}
              </p>
            ) : null}
          </div>

          <footer className="table-footer">
            <p>{filteredData.length ? `${recordCount(pageStart + 1)}–${recordCount(Math.min(pageStart + pageSize, filteredData.length))} of ${recordCount(filteredData.length)} incidents` : '0 incidents'}</p>
            <nav className="pagination" aria-label="Incident log pages">
              <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page">
                <Icon name="chevron-left" />
              </button>
              <span>Page <strong>{safePage}</strong> of {totalPages}</span>
              <button type="button" onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} aria-label="Next page">
                <Icon name="chevron-right" />
              </button>
            </nav>
            <label className="page-size">
              <span>Rows per page</span>
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <Icon name="chevron-down" />
            </label>
          </footer>
        </section>

        <footer className="site-footer">
          <span>Unofficial dashboard. Verify records with campus public safety.</span>
          {latestDataDate ? <span>Latest report {REPORT_DATE_FORMATTER.format(latestDataDate)}</span> : null}
        </footer>
      </main>
    </div>
  );
}
