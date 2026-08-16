import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import apiClient from '../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const STATUS_COLORS: Record<string, string> = {
  Wishlist: '#64748b',
  Applied: '#3b82f6',
  Interview: '#f59e0b',
  Offer: '#10b981',
  Rejected: '#ef4444',
};

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/ai/analytics').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading analytics...</div>;
  if (!data || data.total === 0) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No application data yet</h2>
      <p style={{ fontSize: '0.9rem' }}>Add some job applications to see your metrics and charts.</p>
    </div>
  );

  const statuses = Object.keys(data.statusCounts);
  const doughnutData = {
    labels: statuses,
    datasets: [{
      data: statuses.map(s => data.statusCounts[s]),
      backgroundColor: statuses.map(s => STATUS_COLORS[s] || '#94a3b8'),
      borderWidth: 0,
    }]
  };

  const barData = {
    labels: data.weeklyLabels,
    datasets: [{
      label: 'Applications',
      data: data.weeklyValues,
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } } }
  };

  return (
    <div className="analytics-page">
      {/* Stat Cards (2x2 on Mobile, 4x1 on Desktop) */}
      <div className="analytics-stats-grid">
        {[
          { label: 'Total Applications', value: data.total, color: '#3b82f6' },
          { label: 'Interview Rate', value: `${data.responseRate}%`, color: '#10b981' },
          { label: 'Active Interviews', value: data.statusCounts['Interview'] || 0, color: '#f59e0b' },
          { label: 'Job Offers', value: data.statusCounts['Offer'] || 0, color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} className="stat-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.65rem', padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>{stat.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid (Stacked Full-Width on Mobile, 2 Columns on Desktop) */}
      <div className="analytics-charts-grid">
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.65rem', padding: '1.25rem', height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>Weekly Applications</h3>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.65rem', padding: '1.25rem', height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>Status Distribution</h3>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
