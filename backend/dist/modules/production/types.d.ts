export interface JobResponse {
    id: string;
    description: string;
    targetQuantity: number;
    producedQuantity: number;
    status: string;
    version: number;
    targetCompletionDate: string;
    orderId: string | null;
    customerName: string | null;
    finishedGoodId: string | null;
    finishedGoodName: string | null;
    createdBy: string;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
    productionRuns?: ProductionRunResponse[];
}
export interface ProductionRunResponse {
    id: string;
    jobId: string;
    loggedBy: string;
    loggedByName: string;
    quantityProduced: number;
    runDate: string;
    materialsConsumed: MaterialConsumedResponse[];
}
export interface MaterialConsumedResponse {
    id: string;
    productionRunId: string;
    itemId: string;
    itemName: string;
    unitOfMeasure: string;
    quantityConsumed: number;
}
//# sourceMappingURL=types.d.ts.map