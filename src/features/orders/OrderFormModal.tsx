import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import * as ordersApi from '../../api/orders';
import * as inventoryApi from '../../api/inventory';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OrderFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [customerId, setCustomerId] = useState<string>('');
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [lineItems, setLineItems] = useState<{ finishedGoodId: string; quantity: number; specNotes: string }[]>([
    { finishedGoodId: '', quantity: 50, specNotes: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Quick Customer Creation mode
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustContact, setNewCustContact] = useState('');

  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => ordersApi.getCustomers(),
    staleTime: Infinity
  });

  const { data: finishedGoodsData } = useQuery({
    queryKey: ['inventory', 'finished-goods'],
    queryFn: () => inventoryApi.getInventoryItems({ type: 'finished_good' }),
    staleTime: Infinity
  });

  const finishedGoods = finishedGoodsData?.items || [];

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { finishedGoodId: '', quantity: 10, specNotes: '' }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleCreateCustomerSubmit = async () => {
    if (!newCustName) return;
    try {
      const created = await ordersApi.createCustomer({ name: newCustName, contactInfo: newCustContact });
      await refetchCustomers();
      setCustomerId(created.id);
      setIsCreatingCustomer(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer');
      return;
    }

    const validLineItems = lineItems.filter((li) => li.finishedGoodId && li.quantity > 0);
    if (validLineItems.length === 0) {
      setError('Please add at least one valid line item');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await ordersApi.createOrder({
        customerId,
        lineItems: validLineItems,
        requestedDeliveryDate
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Customer Order">
      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Customer Selection & Quick Add */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
            <label className="form-label">Customer Account</label>
            <button
              type="button"
              onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}
            >
              {isCreatingCustomer ? 'Cancel New Customer' : '+ Add New Customer'}
            </button>
          </div>

          {isCreatingCustomer ? (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Customer Company Name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contact Email / Phone"
                  value={newCustContact}
                  onChange={(e) => setNewCustContact(e.target.value)}
                />
              </div>
              <button type="button" onClick={handleCreateCustomerSubmit} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
                Save & Select Customer
              </button>
            </div>
          ) : (
            <select className="form-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.contactInfo})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Requested Delivery Date</label>
          <input
            type="date"
            required
            className="form-input"
            value={requestedDeliveryDate}
            onChange={(e) => setRequestedDeliveryDate(e.target.value)}
          />
        </div>

        {/* Order Line Items */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label">Order Line Items (Finished Goods)</label>
            <button type="button" onClick={handleAddLineItem} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', gap: '0.25rem' }}>
              <Plus size={14} /> Add Line Item
            </button>
          </div>

          {lineItems.map((li, idx) => (
            <div key={idx} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="form-select"
                  style={{ flex: 2 }}
                  value={li.finishedGoodId}
                  onChange={(e) => handleLineItemChange(idx, 'finishedGoodId', e.target.value)}
                >
                  <option value="">-- Select Finished Product --</option>
                  {finishedGoods.map((fg) => (
                    <option key={fg.id} value={fg.id}>
                      {fg.name} ({fg.unitOfMeasure})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Qty"
                  value={li.quantity}
                  onChange={(e) => handleLineItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                />

                {lineItems.length > 1 && (
                  <button type="button" onClick={() => handleRemoveLineItem(idx)} className="btn btn-danger" style={{ padding: '0.5rem' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <input
                type="text"
                className="form-input"
                style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}
                placeholder="Spec notes (e.g., Anodized silver finish, Class A rating)"
                value={li.specNotes}
                onChange={(e) => handleLineItemChange(idx, 'specNotes', e.target.value)}
              />
            </div>
          ))}

          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Order creation records customer commitments without deducting or reserving inventory (§2.4 Decision 1).
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
