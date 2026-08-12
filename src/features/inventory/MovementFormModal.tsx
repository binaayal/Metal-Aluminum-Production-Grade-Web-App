import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/common/Modal';
import { MovementType } from '../../types/domain';
import * as inventoryApi from '../../api/inventory';

interface Props {
  defaultItemId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MovementFormModal: React.FC<Props> = ({ defaultItemId, isOpen, onClose, onSuccess }) => {
  const [itemId, setItemId] = useState<string>(defaultItemId || '');
  const [movementType, setMovementType] = useState<MovementType>('receipt');
  const [rawQuantity, setRawQuantity] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'all'],
    queryFn: () => inventoryApi.getInventoryItems(),
    staleTime: Infinity
  });

  const items = inventoryData?.items || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) {
      setError('Please select an item');
      return;
    }
    setSubmitting(true);
    setError('');

    // Enforce SIGN CONVENTIONS matching DB CHECK constraints (§3.1)
    let finalQuantity = Math.abs(rawQuantity);
    if (movementType === 'consumption' || movementType === 'shipment') {
      finalQuantity = -finalQuantity;
    } else if (movementType === 'adjustment') {
      // adjustment uses raw quantity as typed
      finalQuantity = rawQuantity;
    }

    try {
      await inventoryApi.recordMovement({
        itemId,
        movementType,
        quantity: finalQuantity,
        notes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Stock Movement (Append-Only Audit Log)">
      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Select Inventory Item</label>
          <select className="form-select" value={itemId} onChange={(e) => setItemId(e.target.value)} required>
            <option value="">-- Select Item --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} (Current Derived Stock: {item.currentStock} {item.unitOfMeasure})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Movement Type Action</label>
            <select
              className="form-select"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
            >
              <option value="receipt">Receipt (Stock intake +)</option>
              <option value="consumption">Consumption (Used in shop -)</option>
              <option value="shipment">Shipment (Finished goods shipped -)</option>
              <option value="adjustment">Adjustment (Scrap/Audit count correction +/-)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Quantity Value {movementType === 'consumption' || movementType === 'shipment' ? '(Deducted -)' : ''}
            </label>
            <input
              type="number"
              step="any"
              required
              className="form-input"
              value={rawQuantity}
              onChange={(e) => setRawQuantity(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Audit Notes & Reference</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Supplier PO #2026-095 intake / Scrap audit correction"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: '#38bdf8', marginBottom: '1rem' }}>
          <strong>Note:</strong> Movements are immutable append-only logs (FR-3.2, NFR-2.3). Stock quantity is always computed as the sum of movements.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Recording...' : 'Record Movement'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
