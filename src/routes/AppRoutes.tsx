import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { RequireAuth } from '../features/auth/RequireAuth';
import { HomeSummaryView } from '../features/dashboard/HomeSummaryView';
import { JobList } from '../features/production/JobList';
import { JobDetail } from '../features/production/JobDetail';
import { ItemList } from '../features/inventory/ItemList';
import { ItemDetail } from '../features/inventory/ItemDetail';
import { OrderList } from '../features/orders/OrderList';
import { OrderDetail } from '../features/orders/OrderDetail';
import { ReportsPage } from '../features/reports/ReportsPage';
import { UserManagement } from '../features/admin/UserManagement';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomeSummaryView />} />
        <Route path="production" element={<JobList />} />
        <Route path="production/:jobId" element={<JobDetail />} />
        <Route path="inventory" element={<ItemList />} />
        <Route path="inventory/:itemId" element={<ItemDetail />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:orderId" element={<OrderDetail />} />
        <Route path="reports" element={<ReportsPage />} />

        <Route
          path="admin/users"
          element={
            <RequireAuth requireOwner>
              <UserManagement />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
