export declare function getProductionReport(params: {
    from?: string;
    to?: string;
    groupBy?: string;
    filterBy?: string;
}): Promise<{
    series: Array<{
        period: string;
        unitsProduced: number;
        jobsCompleted: number;
        avgCompletionDays: number;
    }>;
}>;
export declare function getInventoryReport(params: {
    from?: string;
    to?: string;
    groupBy?: string;
    itemId?: string;
}): Promise<{
    series: Array<{
        period: string;
        consumed: number;
        received: number;
        netChange: number;
    }>;
}>;
export declare function getOrdersReport(params: {
    from?: string;
    to?: string;
    groupBy?: string;
    customerId?: string;
}): Promise<{
    series: Array<{
        period: string;
        orderCount: number;
        onTimeRate: number;
        cancelledCount: number;
    }>;
}>;
//# sourceMappingURL=service.d.ts.map