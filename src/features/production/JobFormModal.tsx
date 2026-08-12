import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/common/Modal';
import { CreateJobInput, CreateJobSchema } from '../../schemas/validation';
import * as productionApi from '../../api/production';
import * as inventoryApi from '../../api/inventory';
import * as ordersApi from '../../api/orders';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JobFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'finished-goods'],
    queryFn: () => inventoryApi.getInventoryItems({ type: 'finished_good' }),
    staleTime: Infinity
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: () => ordersApi.getOrders(),
    staleTime: Infinity
  });

  const finishedGoods = inventoryData?.items || [];
  const activeOrders = ordersData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateJobInput>({
    resolver: zodResolver(CreateJobSchema),
    defaultValues: {
      description: '',
      targetQuantity: 100,
      targetCompletionDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data: CreateJobInput) => {
    setSubmitting(true);
    setServerError('');
    try {
      await productionApi.createJob(data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Production Job">
      {serverError && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.8125rem' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">Job Description / Work Package</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Fabricate 200 units Aluminum Brackets for Order #ord-1"
            {...register('description')}
          />
          {errors.description && <span className="form-error">{errors.description.message}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Target Quantity (Units)</label>
            <input
              type="number"
              className="form-input"
              {...register('targetQuantity', { valueAsNumber: true })}
            />
            {errors.targetQuantity && <span className="form-error">{errors.targetQuantity.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Target Completion Date</label>
            <input
              type="date"
              className="form-input"
              {...register('targetCompletionDate')}
            />
            {errors.targetCompletionDate && <span className="form-error">{errors.targetCompletionDate.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Finished Good Product (Output item in Inventory)</label>
          <select className="form-select" {...register('finishedGoodId')}>
            <option value="">-- Optional: Select Finished Good --</option>
            {finishedGoods.map((fg) => (
              <option key={fg.id} value={fg.id}>
                {fg.name} ({fg.unitOfMeasure})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Link to Customer Order (Optional — §2.4 Decision 3)</label>
          <select className="form-select" {...register('orderId')}>
            <option value="">-- No linked order (Speculative / Buffer Production) --</option>
            {activeOrders.map((o) => (
              <option key={o.id} value={o.id}>
                Order #{o.id} — {o.customerName} (Status: {o.status})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating Job...' : 'Create Job'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
