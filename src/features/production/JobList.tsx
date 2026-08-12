import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext } from 'react-router-dom';
import { Hammer, Plus, Search } from 'lucide-react';
import * as productionApi from '../../api/production';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { ToastMessage } from '../../components/common/Toast';
import { JobFormModal } from './JobFormModal';

export const JobList: React.FC = () => {
  const { isOwner } = useAuth();
  const { setToast } = useOutletContext<{ setToast: (t: ToastMessage) => void }>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs', statusFilter, search],
    queryFn: () => productionApi.getJobs({ status: statusFilter, search }),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const jobs = data?.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Hammer size={24} color="#38bdf8" /> Production Jobs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Track units of work, fabrication sessions, and job lifecycle progress.
          </p>
        </div>

        {/* Owner Create Action */}
        {isOwner && (
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Create Production Job
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
            placeholder="Search jobs by description, customer, or finished good..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</span>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '160px' }}>
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading production jobs...</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No production jobs match your filter criteria.</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Progress (Units)</th>
                  <th>Customer / Order</th>
                  <th>Target Completion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const percent = Math.min(100, Math.round((job.producedQuantity / job.targetQuantity) * 100));
                  return (
                    <tr key={job.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8125rem' }}>{job.id}</td>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/production/${job.id}`} style={{ color: 'var(--text-main)' }}>
                          {job.description}
                        </Link>
                        {job.finishedGoodName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Output: {job.finishedGoodName}</div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={job.status} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', minWidth: '80px' }}>
                            <div
                              style={{
                                width: `${percent}%`,
                                height: '100%',
                                backgroundColor: percent >= 100 ? '#34d399' : '#38bdf8',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {job.producedQuantity} / {job.targetQuantity} ({percent}%)
                          </span>
                        </div>
                      </td>
                      <td>
                        {job.customerName ? (
                          <span>{job.customerName}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Speculative Stock</span>
                        )}
                      </td>
                      <td>{job.targetCompletionDate}</td>
                      <td>
                        <Link to={`/production/${job.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
                          Details & Runs
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

      {/* Modal */}
      {isCreateModalOpen && (
        <JobFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            refetch();
            setToast({
              id: Date.now().toString(),
              type: 'success',
              title: 'Job Created',
              message: 'New production job successfully logged.'
            });
          }}
        />
      )}
    </div>
  );
};
