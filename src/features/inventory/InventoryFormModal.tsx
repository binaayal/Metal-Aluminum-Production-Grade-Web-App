import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/common/Modal';
import { CreateInventoryItemInput, CreateInventoryItemSchema } from '../../schemas/validation';
import * as inventoryApi from '../../api/inventory';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InventoryFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateInventoryItemInput>({
    resolver: zodResolver(CreateInventoryItemSchema),
    defaultValues: {
      name: '',
      itemType: 'raw_material',
      unitOfMeasure: 'sheets',
      lowStockThreshold: 10
    }
  });

  const onSubmit = async (data: CreateInventoryItemInput) => {
    setSubmitting(true);
    setServerError('');
    try {
      await inventoryApi.createInventoryItem(data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to create inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Catalog Inventory Item">
      {serverError && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.8125rem' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">Item Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Aluminum Sheet 6061 3mm (4x8ft)"
            {...register('name')}
          />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Item Type Category</label>
            <select className="form-select" {...register('itemType')}>
              <option value="raw_material">Raw Material (Stock intake / consumed)</option>
              <option value="finished_good">Finished Good (Manufactured product)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Unit of Measure</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. sheets, bars, kg, units"
              {...register('unitOfMeasure')}
            />
            {errors.unitOfMeasure && <span className="form-error">{errors.unitOfMeasure.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Low Stock Reorder Threshold</label>
          <input
            type="number"
            min="0"
            className="form-input"
            {...register('lowStockThreshold', { valueAsNumber: true })}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            When derived stock drops to or below this threshold, a warning alert will trigger on the dashboard (FR-3.3).
          </span>
          {errors.lowStockThreshold && <span className="form-error">{errors.lowStockThreshold.message}</span>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding Item...' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
