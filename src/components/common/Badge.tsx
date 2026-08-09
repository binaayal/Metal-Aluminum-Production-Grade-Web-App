import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  return (
    <span className={`badge badge-${normalized} ${className}`}>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: 'owner' | 'viewer' }> = ({ role }) => {
  return (
    <span className={`badge badge-${role}`}>
      {role === 'owner' ? '👑 Owner (Write)' : '👁️ Viewer (Read-Only)'}
    </span>
  );
};
