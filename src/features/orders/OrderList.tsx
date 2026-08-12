import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext } from 'react-router-dom';
import { Plus, Search, ShoppingBag } from 'lucide-react';
import * as ordersApi from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { ToastMessage } from '../../components/common/Toast';
import { OrderFormModal } from './OrderFormModal';

export const OrderList: React.FC = () => {
  const { isOwner } = useAuth();
  const { setToast } = useOutletContext<{ setToast: (t: ToastMessage) => void }>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter, search],
    queryFn: () => ordersApi.getOrders({ status: statusFilter, search }),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const orders = data?.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ShoppingBag size={24} color="#38bdf8" /> Customer Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Customer commitments, line items specification, and manual fulfillment tracking.
          </p>
        </div>

        {isOwner && (
          <button onClick={() => setIsOrderModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Create Customer Order
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            placeholder="Search orders by customer or product line items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</span>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '180px' }}>
            <option value="all">All Statuses</option>
            <option value="Received">Received</option>
            <option value="In Production">In Production</option>
            <option value="Ready for Delivery">Ready for Delivery</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No customer orders found.</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Status</th>
                  <th>Line Items Count</th>
                  <th>Requested Delivery</th>
                  <th>Linked Jobs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8125rem' }}>
                      <Link to={`/orders/${ord.id}`} style={{ color: '#38bdf8' }}>
                        {ord.id}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ord.customerName}</td>
                    <td>
                      <StatusBadge status={ord.status} />
                    </td>
                    <td>
                      {ord.lineItems?.length || 0} line item(s)
                    </td>
                    <td>{ord.requestedDeliveryDate}</td>
                    <td>{ord.linkedJobsCount || 0} production job(s)</td>
                    <td>
                      <Link to={`/orders/${ord.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isOrderModalOpen && (
        <OrderFormModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onSuccess={() => {
            refetch();
            setToast({
              id: Date.now().toString(),
              type: 'success',
              title: 'Order Created',
              message: 'Customer order recorded without touching inventory (FR-4.4).'
            });
          }}
        />
      )}
    </div>
  );
};
