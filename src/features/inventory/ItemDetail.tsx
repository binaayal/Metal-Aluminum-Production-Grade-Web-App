import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Boxes, Plus } from 'lucide-react';
import * as inventoryApi from '../../api/inventory';
import { useAuth } from '../../context/AuthContext';
import { ToastMessage } from '../../components/common/Toast';
import { MovementFormModal } from './MovementFormModal';

export const ItemDetail: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { setToast } = useOutletContext<{ setToast: (t: ToastMessage) => void }>();
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: () => inventoryApi.getInventoryItem(itemId || ''),
    enabled: !!itemId,
    staleTime: Infinity
  });

  const { data: movementsData, isLoading: movementsLoading, refetch: refetchMovements } = useQuery({
    queryKey: ['stock-movements', itemId],
    queryFn: () => inventoryApi.getItemMovements(itemId!),
    enabled: !!itemId,
    staleTime: Infinity
  });

  if (itemLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading item details...</div>;
  }

  if (!item) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-rose)' }}>Item Not Found</h2>
        <Link to="/inventory" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Inventory Catalog
        </Link>
      </div>
    );
  }

  const movements = movementsData?.items || [];
  const isLow = item.currentStock <= item.lowStockThreshold;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/inventory')} className="btn btn-ghost" style={{ gap: '0.375rem' }}>
          <ArrowLeft size={16} /> Back to Catalog
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {item.id}</span>
      </div>

      {/* Main Item Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</h1>
              <span
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: item.itemType === 'raw_material' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                  color: item.itemType === 'raw_material' ? '#38bdf8' : '#c084fc',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {item.itemType.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Derived Current Stock</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isLow ? '#f87171' : '#34d399' }}>
                  {item.currentStock} <span style={{ fontSize: '1rem', fontWeight: 500 }}>{item.unitOfMeasure}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Low Stock Threshold</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {item.lowStockThreshold} <span style={{ fontSize: '1rem', fontWeight: 500 }}>{item.unitOfMeasure}</span>
                </div>
              </div>
            </div>
          </div>

          {isOwner && (
            <button onClick={() => setIsMovementModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Record Movement for this Item
            </button>
          )}
        </div>

        {isLow && (
          <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertTriangle size={18} />
            <strong>Low Stock Alert:</strong> Stock ({item.currentStock}) is at or below the reorder threshold ({item.lowStockThreshold}).
          </div>
        )}
      </div>

      {/* Movement Audit Trail Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Boxes size={18} color="#38bdf8" /> Immutable Stock Movement Audit Trail
        </h2>

        {movementsLoading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading movement logs...</div>
        ) : movements.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No movements logged yet for this item.</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Recorded By</th>
                  <th>Action Type</th>
                  <th>Quantity Delta</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id}>
                      <td>{new Date(m.recordedAt).toLocaleString()}</td>
                      <td>{m.recordedByName || m.recordedBy}</td>
                      <td>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            backgroundColor:
                              m.movementType === 'receipt'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : m.movementType === 'consumption'
                                ? 'rgba(244, 63, 94, 0.15)'
                                : 'rgba(56, 189, 248, 0.15)',
                            color:
                              m.movementType === 'receipt'
                                ? '#34d399'
                                : m.movementType === 'consumption'
                                ? '#f87171'
                                : '#38bdf8'
                          }}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: isPositive ? '#34d399' : '#f87171' }}>
                        {isPositive ? `+${m.quantity}` : m.quantity} {item.unitOfMeasure}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {m.referenceType ? `${m.referenceType}:${m.referenceId || ''}` : 'manual'}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <MovementFormModal
          defaultItemId={item.id}
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          onSuccess={() => {
            refetchMovements();
            setToast({
              id: Date.now().toString(),
              type: 'success',
              title: 'Movement Recorded',
              message: 'Stock updated and audit trail entry saved.'
            });
          }}
        />
      )}
    </div>
  );
};
