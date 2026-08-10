import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Boxes,
  Factory,
  Hammer,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/common/Badge';
import { Toast, ToastMessage } from '../components/common/Toast';

export const DashboardLayout: React.FC = () => {
  const { user, isOwner, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    // P5 Manual Refresh implementation: invalidate all active query caches
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Dashboard Refreshed',
        message: 'All queries updated to latest operational snapshot.'
      });
    }, 300);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          height: '64px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a'
            }}
          >
            <Factory size={22} fontWeight="bold" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
              METAL & ALUMINUM WORKS
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Facility Operations System v1.0
            </div>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* P5 Compliance Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary"
            title="Manual Page Refresh (P5 requirement: No live push)"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>



          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{user?.name || 'User'}</div>
              <RoleBadge role={user?.role || 'viewer'} />
            </div>
            <button onClick={handleLogout} className="btn btn-ghost" title="Logout" style={{ padding: '0.5rem' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout with Sidebar */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '240px',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            borderRight: '1px solid var(--border-color)',
            padding: '1.25rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem'
          }}
        >
          <div style={{ padding: '0 0.75rem 0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Modules
          </div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', padding: '0.625rem 0.875rem' }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard Home</span>
          </NavLink>

          <NavLink
            to="/production"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', padding: '0.625rem 0.875rem' }}
          >
            <Hammer size={18} />
            <span>Production Jobs</span>
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', padding: '0.625rem 0.875rem' }}
          >
            <Boxes size={18} />
            <span>Inventory & Stock</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', padding: '0.625rem 0.875rem' }}
          >
            <ShoppingBag size={18} />
            <span>Customer Orders</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', padding: '0.625rem 0.875rem' }}
          >
            <BarChart3 size={18} />
            <span>Trend Analytics</span>
          </NavLink>

          {isOwner && (
            <>
              <div style={{ padding: '1rem 0.75rem 0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Administration
              </div>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{ justifyContent: 'flex-start', padding: '0.625rem 0.875rem' }}
              >
                <Users size={18} />
                <span>User Management</span>
              </NavLink>
            </>
          )}

          <div style={{ marginTop: 'auto', padding: '1rem 0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: isOwner ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>
              <ShieldAlert size={14} />
              {isOwner ? 'Owner Mode (Full Write)' : 'Viewer Mode (Read-Only)'}
            </div>
            <div style={{ marginTop: '0.25rem', fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
              {isOwner ? 'You can create, edit and log production.' : 'Write forms & edit buttons are restricted.'}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet context={{ setToast }} />
        </main>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
