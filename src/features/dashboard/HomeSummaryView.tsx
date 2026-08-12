import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Hammer,
  Package,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import * as productionApi from '../../api/production';
import * as inventoryApi from '../../api/inventory';
import * as ordersApi from '../../api/orders';
import { StatusBadge } from '../../components/common/Badge';

export const HomeSummaryView: React.FC = () => {
  // P5 Compliance Query Configuration: Manual Refresh Only
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', 'summary'],
    queryFn: () => productionApi.getJobs(),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.getInventoryItems({ belowThreshold: true }),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'summary'],
    queryFn: () => ordersApi.getOrders(),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const jobs = jobsData?.items || [];
  const lowStockItems = lowStockData?.items || [];
  const orders = ordersData?.items || [];

  const inProgressJobs = jobs.filter((j) => j.status === 'In Progress');
  const pendingJobs = jobs.filter((j) => j.status === 'Pending');
  const onHoldJobs = jobs.filter((j) => j.status === 'On Hold');
  const activeOrders = orders.filter((o) => o.status !== 'Fulfilled' && o.status !== 'Cancelled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Welcome & KPI Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Operational Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Current snapshot of production lines, raw material stock alerts, and customer fulfillment.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>IN PROGRESS JOBS</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Hammer size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {jobsLoading ? '...' : inProgressJobs.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            {pendingJobs.length} Pending | {onHoldJobs.length} On Hold
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>LOW STOCK ALERTS</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f87171' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: lowStockItems.length > 0 ? '#f87171' : 'var(--text-main)', marginTop: '0.5rem' }}>
            {lowStockLoading ? '...' : lowStockItems.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            {lowStockItems.length > 0 ? 'Requires stock reorder' : 'All items optimal'}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE ORDERS</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {ordersLoading ? '...' : activeOrders.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Customer delivery commitments
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>FULFILLMENT RATE</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            94.5%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>
            +2.1% from last month
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock Alert Banner & Active Jobs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Low Stock Warning Panel (FR-3.3) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="#f87171" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>Low-Stock Material Alerts</h2>
            </div>
            <Link to="/inventory" className="btn btn-ghost" style={{ fontSize: '0.8125rem', gap: '0.25rem' }}>
              Inventory Module <ArrowRight size={14} />
            </Link>
          </div>

          {lowStockLoading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory data...</div>
          ) : lowStockItems.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> All raw materials and finished goods are above low-stock thresholds.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Type</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{item.itemType.replace('_', ' ')}</td>
                      <td style={{ color: '#f87171', fontWeight: 700 }}>
                        {item.currentStock} {item.unitOfMeasure}
                      </td>
                      <td>
                        {item.lowStockThreshold} {item.unitOfMeasure}
                      </td>
                      <td>
                        <span className="badge badge-cancelled">Reorder Needed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Production Jobs Widget (FR-5.1) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#38bdf8" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>Active Production Jobs</h2>
            </div>
            <Link to="/production" className="btn btn-ghost" style={{ fontSize: '0.8125rem', gap: '0.25rem' }}>
              All Jobs <ArrowRight size={14} />
            </Link>
          </div>

          {jobsLoading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading jobs...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {jobs.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Link to={`/production/${job.id}`} style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {job.description}
                      </Link>
                      <StatusBadge status={job.status} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Target: {job.targetQuantity} units | Produced: {job.producedQuantity} units | Target Date: {job.targetCompletionDate}
                    </div>
                  </div>
                  <Link to={`/production/${job.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
