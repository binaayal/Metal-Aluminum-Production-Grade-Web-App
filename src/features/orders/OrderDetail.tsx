import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Hammer, ShoppingBag, Truck } from 'lucide-react';
import * as ordersApi from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { ToastMessage } from '../../components/common/Toast';
import { OrderStatus } from '../../types/domain';

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { setToast } = useOutletContext<{ setToast: (t: ToastMessage) => void }>();

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrder(orderId || ''),
    enabled: !!orderId,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      await ordersApi.updateOrder(order.id, {
        status: newStatus,
        version: order.version // Optimistic concurrency control
      });
      refetch();
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Order Status Updated',
        message: `Order transitioned to ${newStatus}.`
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Conflict Error',
        message: err.message || 'Failed to update order status.'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading order details...</div>;
  }

  if (!order) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-rose)' }}>Order Not Found</h2>
        <Link to="/orders" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Orders List
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/orders')} className="btn btn-ghost" style={{ gap: '0.375rem' }}>
          <ArrowLeft size={16} /> Back to Customer Orders
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Version: v{order.version}</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Main Order Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ORDER ID: {order.id}</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              Customer: {order.customerName}
            </h1>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Requested Delivery: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{order.requestedDeliveryDate}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Order Date: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Created By: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{order.createdByName || order.createdBy}</span>
              </div>
            </div>
          </div>

          {/* Owner Lifecycle Actions */}
          {isOwner && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Manual Lifecycle Controls:</div>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {order.status === 'Received' && (
                  <button onClick={() => handleStatusChange('In Production')} disabled={updatingStatus} className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
                    Set In Production
                  </button>
                )}
                {order.status === 'In Production' && (
                  <button onClick={() => handleStatusChange('Ready for Delivery')} disabled={updatingStatus} className="btn btn-secondary" style={{ fontSize: '0.75rem', color: '#c084fc' }}>
                    Set Ready for Delivery
                  </button>
                )}
                {order.status === 'Ready for Delivery' && (
                  <button onClick={() => handleStatusChange('Fulfilled')} disabled={updatingStatus} className="btn btn-secondary" style={{ fontSize: '0.75rem', color: '#34d399' }}>
                    Mark Fulfilled
                  </button>
                )}
                {order.status !== 'Fulfilled' && order.status !== 'Cancelled' && (
                  <button onClick={() => handleStatusChange('Cancelled')} disabled={updatingStatus} className="btn btn-danger" style={{ fontSize: '0.75rem' }}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag size={18} color="#38bdf8" /> Order Line Items & Specifications
        </h2>

        {!order.lineItems || order.lineItems.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No line items attached.</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Line Item ID</th>
                  <th>Finished Product</th>
                  <th>Quantity</th>
                  <th>Specification Notes</th>
                </tr>
              </thead>
              <tbody>
                {order.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{item.id}</td>
                    <td style={{ fontWeight: 600 }}>{item.finishedGoodName}</td>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{item.quantity} units</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.specNotes || 'Standard specification'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Linked Production Jobs Note */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Hammer size={18} color="#38bdf8" /> Linked Production Jobs (§2.4 Decision 2)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Order lifecycle and Job lifecycles are manually decoupled. Completing a job does not automatically trigger order status updates.
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/production" className="btn btn-secondary" style={{ fontSize: '0.8125rem', gap: '0.375rem' }}>
            View Production Jobs Module <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
          </Link>
        </div>
      </div>
    </div>
  );
};
