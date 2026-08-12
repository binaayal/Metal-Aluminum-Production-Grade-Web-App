import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Job } from '../../types/domain';
import * as productionApi from '../../api/production';
import * as inventoryApi from '../../api/inventory';

interface Props {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductionRunModal: React.FC<Props> = ({ job, isOpen, onClose, onSuccess }) => {
  const [quantityProduced, setQuantityProduced] = useState<number>(0);
  const [materials, setMaterials] = useState<{ itemId: string; quantity: number }[]>([
    { itemId: '', quantity: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: rawMaterialsData } = useQuery({
    queryKey: ['inventory', 'raw-materials'],
    queryFn: () => inventoryApi.getInventoryItems({ type: 'raw_material' }),
    staleTime: Infinity
  });

  const rawMaterials = rawMaterialsData?.items || [];

  const handleAddMaterialRow = () => {
    setMaterials([...materials, { itemId: '', quantity: 1 }]);
  };

  const handleRemoveMaterialRow = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: 'itemId' | 'quantity', value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const validMaterials = materials.filter((m) => m.itemId && m.quantity > 0);

    try {
      await productionApi.logProductionRun(job.id, {
        quantityProduced,
        materialsConsumed: validMaterials
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log production run');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Production Run — ${job.id}`}>
      <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{job.description}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Target: {job.targetQuantity} units | Produced so far: {job.producedQuantity} units
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Quantity Produced in this Session (Units)</label>
          <input
            type="number"
            min="0"
            required
            className="form-input"
            value={quantityProduced}
            onChange={(e) => setQuantityProduced(parseInt(e.target.value) || 0)}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Logging output automatically adds {quantityProduced} units of finished good stock to inventory if assigned.
          </span>
        </div>

        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label">Raw Materials Consumed in this Session</label>
            <button type="button" onClick={handleAddMaterialRow} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', gap: '0.25rem' }}>
              <Plus size={14} /> Add Material Row
            </button>
          </div>

          {materials.map((mat, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <select
                className="form-select"
                style={{ flex: 2 }}
                value={mat.itemId}
                onChange={(e) => handleMaterialChange(idx, 'itemId', e.target.value)}
              >
                <option value="">-- Select Raw Material --</option>
                {rawMaterials.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} (Stock: {rm.currentStock} {rm.unitOfMeasure})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0.1"
                step="any"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Qty"
                value={mat.quantity}
                onChange={(e) => handleMaterialChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
              />

              {materials.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveMaterialRow(idx)}
                  className="btn btn-danger"
                  style={{ padding: '0.5rem' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Consumed materials generate an audit-logged StockMovement (type: Consumption) in Inventory.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Recording Run...' : 'Record Production Run'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
