import { apiGet } from './client';
import type { ProductionReportSeries, InventoryReportSeries, OrderReportSeries } from '../types/domain';

function computeDateRange(days: number): { from: string; to: string } {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { from, to };
}

export async function getProductionReport(days = 30): Promise<{ series: ProductionReportSeries[] }> {
  const { from, to } = computeDateRange(days);
  return apiGet<{ series: ProductionReportSeries[] }>('/api/reports/production', { from, to });
}

export async function getInventoryReport(days = 30): Promise<{ series: InventoryReportSeries[] }> {
  const { from, to } = computeDateRange(days);
  return apiGet<{ series: InventoryReportSeries[] }>('/api/reports/inventory', { from, to });
}

export async function getOrderReport(days = 30): Promise<{ series: OrderReportSeries[] }> {
  const { from, to } = computeDateRange(days);
  return apiGet<{ series: OrderReportSeries[] }>('/api/reports/orders', { from, to });
}
