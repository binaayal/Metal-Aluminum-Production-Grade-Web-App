import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { BarChart3, Boxes, Calendar, Hammer, ShoppingBag, TrendingUp } from 'lucide-react';
import * as reportsApi from '../../api/reports';

export const ReportsPage: React.FC = () => {
  const [rangeDays, setRangeDays] = useState<number>(30);

  const { data: prodReport } = useQuery({
    queryKey: ['reports', 'production', rangeDays],
    queryFn: () => reportsApi.getProductionReport(rangeDays),
    staleTime: Infinity
  });

  const { data: invReport } = useQuery({
    queryKey: ['reports', 'inventory', rangeDays],
    queryFn: () => reportsApi.getInventoryReport(rangeDays),
    staleTime: Infinity
  });

  const { data: orderReport } = useQuery({
    queryKey: ['reports', 'orders', rangeDays],
    queryFn: () => reportsApi.getOrderReport(rangeDays),
    staleTime: Infinity
  });

  const prodSeries = prodReport?.series || [];
  const invSeries = invReport?.series || [];
  const orderSeries = orderReport?.series || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <BarChart3 size={24} color="#38bdf8" /> Historical Trend & Aggregation Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Aggregated metrics over time for production throughput, material consumption balance, and fulfillment.
          </p>
        </div>

        {/* Date Range Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Time Period:</span>
          <button
            onClick={() => setRangeDays(30)}
            className={`btn ${rangeDays === 30 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
          >
            30 Days
          </button>
          <button
            onClick={() => setRangeDays(90)}
            className={`btn ${rangeDays === 90 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
          >
            90 Days
          </button>
          <button
            onClick={() => setRangeDays(365)}
            className={`btn ${rangeDays === 365 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
          >
            1 Year
          </button>
        </div>
      </div>

      {/* Chart 1: Production Trends (FR-6.1) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hammer size={20} color="#38bdf8" /> Production Throughput & Job Completion Rate
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Units produced per period vs average completion velocity (days).
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prodSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="unitsProduced" name="Units Produced" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="jobsCompleted" name="Jobs Completed" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgCompletionDays" name="Avg Completion Days" stroke="#34d399" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Inventory Material Balance Trends (FR-6.2) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Boxes size={20} color="#c084fc" /> Raw Material Intake vs Production Consumption Balance
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Receipts intake vs consumption usage to spot recurring low stock patterns.
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={invSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="received" name="Stock Intake (Received)" stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="consumed" name="Production Consumed" stroke="#f87171" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="netChange" name="Net Inventory Delta" stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Order Fulfillment Rate Trends (FR-6.3) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={20} color="#fbbf24" /> Customer Order Volume & On-Time Fulfillment %
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              On-time delivery percentage vs order volume intake.
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={orderSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" domain={[70, 100]} stroke="#fbbf24" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="orderCount" name="Order Volume" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="onTimeRate" name="On-Time Delivery Rate %" stroke="#fbbf24" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
