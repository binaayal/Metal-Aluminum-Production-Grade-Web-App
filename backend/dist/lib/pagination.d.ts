/**
 * Pagination helper: simple ?limit=&offset= on all list endpoints.
 * Default limit=50, max 200. No cursor-based pagination — unnecessary
 * complexity at this data volume (full-stack-design §2.1).
 */
export interface PaginationParams {
    limit: number;
    offset: number;
}
export declare function parsePagination(query: {
    limit?: string;
    offset?: string;
}): PaginationParams;
//# sourceMappingURL=pagination.d.ts.map