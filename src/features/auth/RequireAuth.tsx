import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const RequireAuth: React.FC<{ children: React.ReactNode; requireOwner?: boolean }> = ({
  children,
  requireOwner = false
}) => {
  const { user, loading, isOwner } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading authentication state...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOwner && !isOwner) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-rose)' }}>403 - Forbidden</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          This administrative route requires an Owner account. You are currently in Viewer mode.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
