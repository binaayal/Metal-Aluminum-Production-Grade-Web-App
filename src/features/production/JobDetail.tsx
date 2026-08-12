import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Hammer, AlertTriangle, Plus, XCircle } from 'lucide-react';
import * as productionApi from '../../api/production';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { ToastMessage } from '../../components/common/Toast';
import { ProductionRunModal } from './ProductionRunModal';
import { JobStatus } from '../../types/domain';

export const JobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { setToast } = useOutletContext<{ setToast: (t: ToastMessage) => void }>();

  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: job, isLoading, refetch } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => productionApi.getJob(jobId || ''),
    enabled: !!jobId,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    setUpdatingStatus(true);
    try {
      await productionApi.updateJob(job.id, {
        status: newStatus,
        version: job.version // Optimistic locking version check
      });
      refetch();
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Status Updated',
        message: `Job state transitioned to ${newStatus}.`
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Update Conflict',
        message: err.message || 'Failed to update job status.'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading job details...</div>;
  }

  if (!job) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-rose)' }}>Job Not Found</h2>
        <Link to="/production" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Jobs List
        </Link>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((job.producedQuantity / job.targetQuantity) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/production')} className="btn btn-ghost" style={{ gap: '0.375rem' }}>
          <ArrowLeft size={16} /> Back to Jobs
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Version: v{job.version}</span>
          <StatusBadge status={job.status} />
        </div>
      </div>

      {/* Main Header Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>JOB ID: {job.id}</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>{job.description}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Output Good: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{job.finishedGoodName || 'Not catalogued'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Customer: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{job.customerName || 'Speculative Stock'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Target Date: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{job.targetCompletionDate}</span>
              </div>
            </div>
          </div>

          {/* Owner Lifecycle Actions */}
          {isOwner && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button onClick={() => setIsRunModalOpen(true)} className="btn btn-primary">
                <Plus size={16} /> Log Production Run
              </button>

              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                {job.status === 'Pending' && (
                  <button onClick={() => handleStatusChange('In Progress')} disabled={updatingStatus} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
                    Start Job
                  </button>
                )}
                {job.status === 'In Progress' && (
                  <>
                    <button onClick={() => handleStatusChange('On Hold')} disabled={updatingStatus} className="btn btn-secondary" style={{ fontSize: '0.75rem', color: '#fb923c' }}>
                      Put On Hold
                    </button>
                    <button onClick={() => handleStatusChange('Completed')} disabled={updatingStatus} className="btn btn-secondary" style={{ fontSize: '0.75rem', color: '#34d399' }}>
                      Complete Job
                    </button>
                  </>
                )}
                {job.status === 'On Hold' && (
                  <button onClick={() => handleStatusChange('In Progress')} disabled={updatingStatus} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
                    Resume Job
                  </button>
                )}
                {job.status !== 'Cancelled' && job.status !== 'Completed' && (
                  <button onClick={() => handleStatusChange('Cancelled')} disabled={updatingStatus} className="btn btn-danger" style={{ fontSize: '0.75rem' }}>
                    Cancel Job
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar Container */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Production Progress</span>
            <span style={{ fontWeight: 700, color: percent >= 100 ? '#34d399' : '#38bdf8' }}>
              {job.producedQuantity} / {job.targetQuantity} units ({percent}%)
            </span>
          </div>
          <div style={{ height: '12px', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: percent >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #3b82f6, #38bdf8)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Production Run Log History */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Hammer size={18} color="#38bdf8" /> Work Sessions & Material Consumption Audit Log
        </h2>

        {!job.productionRuns || job.productionRuns.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No work sessions logged yet against this job. {isOwner ? 'Click "Log Production Run" above to record output.' : ''}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {job.productionRuns.map((run) => (
              <div
                key={run.id}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#38bdf8' }}>
                      Session Output: +{run.quantityProduced} units
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
                      Logged by {run.loggedByName || run.loggedBy} on {new Date(run.runDate).toLocaleString()}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>{run.id}</span>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Materials Consumed:</div>
                  {run.materialsConsumed && run.materialsConsumed.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {run.materialsConsumed.map((m) => (
                        <span
                          key={m.id}
                          style={{
                            backgroundColor: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid rgba(244, 63, 94, 0.25)',
                            color: '#f87171',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem'
                          }}
                        >
                          {m.itemName || 'Material'}: {m.quantityConsumed} {m.unitOfMeasure}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>No materials deducted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Production Run Modal */}
      {isRunModalOpen && (
        <ProductionRunModal
          job={job}
          isOpen={isRunModalOpen}
          onClose={() => setIsRunModalOpen(false)}
          onSuccess={() => {
            refetch();
            setToast({
              id: Date.now().toString(),
              type: 'success',
              title: 'Production Run Logged',
              message: 'Output and raw material deductions recorded successfully.'
            });
          }}
        />
      )}
    </div>
  );
};
