import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
function getDateTrunc(groupBy) {
    switch (groupBy) {
        case 'day': return 'day';
        case 'week': return 'week';
        case 'month': return 'month';
        default: return 'day';
    }
}
function formatPeriod(date, groupBy) {
    const iso = date.toISOString();
    switch (groupBy) {
        case 'day': return iso.split('T')[0]; // YYYY-MM-DD
        case 'week': {
            // ISO week format: YYYY-WNN
            const d = new Date(date);
            const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
            const week = Math.ceil(dayOfYear / 7);
            return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
        }
        case 'month': return iso.substring(0, 7); // YYYY-MM
        default: return iso.split('T')[0];
    }
}
// ── Production Report ───────────────────────────────────
export async function getProductionReport(params) {
    const groupBy = (params.groupBy || 'day');
    const trunc = getDateTrunc(groupBy);
    // Build date range filter
    const fromDate = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = params.to ? new Date(params.to) : new Date();
    // Use raw query for date_trunc aggregation
    const runsResult = await prisma.$queryRaw `
    SELECT date_trunc(${trunc}, pr.run_date) as period,
           COALESCE(SUM(pr.quantity_produced), 0) as units_produced
    FROM production.production_runs pr
    JOIN production.jobs j ON pr.job_id = j.id
    WHERE pr.run_date >= ${fromDate}
      AND pr.run_date <= ${toDate}
      ${params.filterBy ? Prisma.sql `AND j.finished_good_id = ${params.filterBy}::uuid` : Prisma.empty}
    GROUP BY period
    ORDER BY period ASC
  `;
    const jobsResult = await prisma.$queryRaw `
    SELECT date_trunc(${trunc}, j.updated_at) as period,
           COUNT(*) as jobs_completed,
           AVG(EXTRACT(EPOCH FROM (j.updated_at - j.created_at)) / 86400) as avg_days
    FROM production.jobs j
    WHERE j.status = 'Completed'
      AND j.updated_at >= ${fromDate}
      AND j.updated_at <= ${toDate}
      ${params.filterBy ? Prisma.sql `AND j.finished_good_id = ${params.filterBy}::uuid` : Prisma.empty}
    GROUP BY period
    ORDER BY period ASC
  `;
    // Merge results by period
    const periodMap = new Map();
    for (const row of runsResult) {
        const p = formatPeriod(row.period, groupBy);
        const existing = periodMap.get(p) || { unitsProduced: 0, jobsCompleted: 0, avgCompletionDays: 0 };
        existing.unitsProduced = Number(row.units_produced);
        periodMap.set(p, existing);
    }
    for (const row of jobsResult) {
        const p = formatPeriod(row.period, groupBy);
        const existing = periodMap.get(p) || { unitsProduced: 0, jobsCompleted: 0, avgCompletionDays: 0 };
        existing.jobsCompleted = Number(row.jobs_completed);
        existing.avgCompletionDays = Math.round((row.avg_days || 0) * 10) / 10;
        periodMap.set(p, existing);
    }
    const series = Array.from(periodMap.entries())
        .map(([period, data]) => ({ period, ...data }))
        .sort((a, b) => a.period.localeCompare(b.period));
    return { series };
}
// ── Inventory Report ────────────────────────────────────
export async function getInventoryReport(params) {
    const groupBy = (params.groupBy || 'day');
    const trunc = getDateTrunc(groupBy);
    const fromDate = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = params.to ? new Date(params.to) : new Date();
    const result = await prisma.$queryRaw `
    SELECT date_trunc(${trunc}, sm.recorded_at) as period,
           COALESCE(SUM(CASE WHEN sm.movement_type = 'consumption' THEN ABS(sm.quantity) ELSE 0 END), 0) as consumed,
           COALESCE(SUM(CASE WHEN sm.movement_type = 'receipt' THEN sm.quantity ELSE 0 END), 0) as received,
           COALESCE(SUM(sm.quantity), 0) as net_change
    FROM inventory.stock_movements sm
    WHERE sm.recorded_at >= ${fromDate}
      AND sm.recorded_at <= ${toDate}
      ${params.itemId ? Prisma.sql `AND sm.item_id = ${params.itemId}::uuid` : Prisma.empty}
    GROUP BY period
    ORDER BY period ASC
  `;
    const series = result.map((row) => ({
        period: formatPeriod(row.period, groupBy),
        consumed: Number(row.consumed),
        received: Number(row.received),
        netChange: Number(row.net_change),
    }));
    return { series };
}
// ── Orders Report ───────────────────────────────────────
export async function getOrdersReport(params) {
    const groupBy = (params.groupBy || 'day');
    const trunc = getDateTrunc(groupBy);
    const fromDate = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = params.to ? new Date(params.to) : new Date();
    const result = await prisma.$queryRaw `
    SELECT date_trunc(${trunc}, o.created_at) as period,
           COUNT(*) as order_count,
           COUNT(CASE WHEN o.status = 'Fulfilled' AND o.updated_at <= o.requested_delivery_date THEN 1 END) as on_time_count,
           COUNT(CASE WHEN o.status = 'Fulfilled' THEN 1 END) as fulfilled_count,
           COUNT(CASE WHEN o.status = 'Cancelled' THEN 1 END) as cancelled_count
    FROM orders.orders o
    WHERE o.created_at >= ${fromDate}
      AND o.created_at <= ${toDate}
      ${params.customerId ? Prisma.sql `AND o.customer_id = ${params.customerId}::uuid` : Prisma.empty}
    GROUP BY period
    ORDER BY period ASC
  `;
    const series = result.map((row) => {
        const fulfilled = Number(row.fulfilled_count);
        const onTime = Number(row.on_time_count);
        return {
            period: formatPeriod(row.period, groupBy),
            orderCount: Number(row.order_count),
            onTimeRate: fulfilled > 0 ? Math.round((onTime / fulfilled) * 100) : 0,
            cancelledCount: Number(row.cancelled_count),
        };
    });
    return { series };
}
//# sourceMappingURL=service.js.map