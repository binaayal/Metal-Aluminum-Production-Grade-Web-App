/**
 * Pagination helper: simple ?limit=&offset= on all list endpoints.
 * Default limit=50, max 200. No cursor-based pagination — unnecessary
 * complexity at this data volume (full-stack-design §2.1).
 */
export function parsePagination(query) {
    let limit = parseInt(query.limit || '50', 10);
    let offset = parseInt(query.offset || '0', 10);
    if (isNaN(limit) || limit < 1)
        limit = 50;
    if (limit > 200)
        limit = 200;
    if (isNaN(offset) || offset < 0)
        offset = 0;
    return { limit, offset };
}
//# sourceMappingURL=pagination.js.map