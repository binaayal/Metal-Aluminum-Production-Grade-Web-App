export interface CustomerResponse {
    id: string;
    name: string;
    contactInfo: string;
    createdAt: string;
}
export interface OrderLineItemResponse {
    id: string;
    orderId: string;
    finishedGoodId: string;
    finishedGoodName: string;
    quantity: number;
    specNotes: string | null;
}
export interface OrderResponse {
    id: string;
    customerId: string;
    customerName: string;
    createdBy: string;
    createdByName: string;
    status: string;
    requestedDeliveryDate: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    lineItems: OrderLineItemResponse[];
    linkedJobsCount: number;
}
//# sourceMappingURL=types.d.ts.map