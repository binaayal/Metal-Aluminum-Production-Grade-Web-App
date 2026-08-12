import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext } from 'react-router-dom';
import { AlertTriangle, Boxes, Plus, Search } from 'lucide-react';
import * as inventoryApi from '../../api/inventory';
import { useAuth } from '../../context/AuthContext';
import { ToastMessage } from '../../components/common/Toast';
import { InventoryFormModal } from './InventoryFormModal';
import { MovementFormModal } from './MovementFormModal';

export const ItemList: React.FC = () => {
  const { isOwner } = useAuth();
  const { setToast } = useOutletContext<{ setToast: (t: ToastMessage) => void }>();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [belowThreshold, setBelowThreshold] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [movementModalItemId, setMovementModalItemId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory', typeFilter, belowThreshold, search],
    queryFn: () => inventoryApi.getInventoryItems({ type: typeFilter, belowThreshold, search }),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const items = data?.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Boxes size={24} color="#38bdf8" /> Inventory & Stock Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Raw materials intake, finished goods catalog, and append-only stock movement tracking.
          </p>
        </div>

        {isOwner && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setMovementModalItemId('general')} className="btn btn-secondary">
              <Plus size={16} /> Record Stock Movement
            </button>
            <button onClick={() => setIsItemModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Add Catalog Item
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            placeholder="Search items by name or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Type:</span>
            <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: '160px' }}>
              <option value="all">All Types</option>
              <option value="raw_material">Raw Materials</option>
              <option value="finished_good">Finished Goods</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={belowThreshold}
              onChange={(e) => setBelowThreshold(e.target.checked)}
            />
            Show Low Stock Only
          </label>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory catalog...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No inventory items match your filter.</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Current Derived Stock</th>
                  <th>Low Stock Threshold</th>
                  <th>Stock Status</th>
                  <th>Audit Trail</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLow = item.currentStock <= item.lowStockThreshold;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/inventory/${item.id}`} style={{ color: 'var(--text-main)' }}>
                          {item.name}
                        </Link>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: item.itemType === 'raw_material' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                            color: item.itemType === 'raw_material' ? '#38bdf8' : '#c084fc',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {item.itemType.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '1rem', color: isLow ? '#f87171' : 'var(--text-main)' }}>
                        {item.currentStock} {item.unitOfMeasure}
                      </td>
                      <td>
                        {item.lowStockThreshold} {item.unitOfMeasure}
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-cancelled" style={{ gap: '0.25rem' }}>
                            <AlertTriangle size={12} /> Low Stock Alert
                          </span>
                        ) : (
                          <span className="badge badge-completed">Optimal Stock</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/inventory/${item.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
                          Movement Log
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isItemModalOpen && (
        <InventoryFormModal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSuccess={() => {
            refetch();
            setToast({
              id: Date.now().toString(),
              type: 'success',
              title: 'Item Created',
              message: 'New inventory item added to catalog.'
            });
          }}
        />
      )}

      {movementModalItemId && (
        <MovementFormModal
          defaultItemId={movementModalItemId === 'general' ? undefined : movementModalItemId}
          isOpen={!!movementModalItemId}
          onClose={() => setMovementModalItemId(null)}
          onSuccess={() => {
            refetch();
            setToast({
              id: Date.now().toString(),
              type: 'success',
              title: 'Movement Recorded',
              message: 'Stock movement logged and derived stock recalculated.'
            });
          }}
        />
      )}
    </div>
  );
};
