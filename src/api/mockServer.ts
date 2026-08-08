import {
  Customer,
  InventoryItem,
  InventoryReportSeries,
  Job,
  MaterialConsumedRecord,
  MovementType,
  Order,
  OrderReportSeries,
  ProductionReportSeries,
  ProductionRun,
  StockMovement,
  User
} from '../types/domain';
import { ApiErrorEnvelope } from '../types/api';
import {
  initialCustomers,
  initialInventoryItems,
  initialJobs,
  initialOrders,
  initialStockMovements,
  initialUsers
} from './mockData';

class MockServer {
  private users: User[] = [...initialUsers];
  private inventoryItems: InventoryItem[] = [...initialInventoryItems];
  private stockMovements: StockMovement[] = [...initialStockMovements];
  private customers: Customer[] = [...initialCustomers];
  private orders: Order[] = [...initialOrders];
  private jobs: Job[] = [...initialJobs];
  private currentUser: User = initialUsers[0]; // Default Owner

  // Helper: throw API error
  private createError(code: string, message: string, status = 400, fields?: Record<string, string>): never {
    const errorEnvelope: ApiErrorEnvelope = {
      error: { code, message, fields }
    };
    const err = new Error(message) as any;
    err.status = status;
    err.data = errorEnvelope;
    throw err;
  }

  // Recalculate derived current stock for an item
  private recomputeStock(itemId: string) {
    const total = this.stockMovements
      .filter((m) => m.itemId === itemId)
      .reduce((sum, m) => sum + m.quantity, 0);
    const item = this.inventoryItems.find((i) => i.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, total);
    }
  }

  // AUTH
  public login(email: string, role?: 'owner' | 'viewer'): User {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Create user on the fly if testing other emails
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: role || 'viewer',
        active: true
      };
      this.users.push(newUser);
      this.currentUser = newUser;
      return newUser;
    }
    if (!user.active) {
      this.createError('ACCOUNT_DISABLED', 'User account has been deactivated', 403);
    }
    this.currentUser = user;
    return user;
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  public switchRole(role: 'owner' | 'viewer') {
    this.currentUser = { ...this.currentUser, role };
  }

  // USERS (Owner only)
  public getUsers(): User[] {
    return this.users;
  }

  public createUser(input: { name: string; email: string; role: 'owner' | 'viewer' }): User {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Only Owners can provision users', 403);
    }
    if (this.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      this.createError('EMAIL_EXISTS', 'Email is already in use', 400, { email: 'Email is already registered' });
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: input.name,
      email: input.email,
      role: input.role,
      active: true
    };
    this.users.push(newUser);
    return newUser;
  }

  public updateUser(id: string, input: { name?: string; role?: 'owner' | 'viewer'; active?: boolean }): User {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Only Owners can update users', 403);
    }
    const user = this.users.find((u) => u.id === id);
    if (!user) this.createError('NOT_FOUND', 'User not found', 404);
    if (input.name !== undefined) user.name = input.name;
    if (input.role !== undefined) user.role = input.role;
    if (input.active !== undefined) user.active = input.active;
    return user;
  }

  // INVENTORY MODULE
  public getInventoryItems(params?: { type?: string; belowThreshold?: boolean; search?: string }): InventoryItem[] {
    let items = [...this.inventoryItems];
    if (params?.type && params.type !== 'all') {
      items = items.filter((i) => i.itemType === params.type);
    }
    if (params?.belowThreshold) {
      items = items.filter((i) => i.currentStock <= i.lowStockThreshold);
    }
    if (params?.search) {
      const query = params.search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(query) || i.unitOfMeasure.toLowerCase().includes(query));
    }
    return items;
  }

  public getInventoryItem(id: string): InventoryItem {
    const item = this.inventoryItems.find((i) => i.id === id);
    if (!item) this.createError('NOT_FOUND', 'Inventory item not found', 404);
    return item;
  }

  public createInventoryItem(input: { name: string; itemType: 'raw_material' | 'finished_good'; unitOfMeasure: string; lowStockThreshold: number }): InventoryItem {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Viewer sessions cannot modify inventory', 403);
    }
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: input.name,
      itemType: input.itemType,
      unitOfMeasure: input.unitOfMeasure,
      lowStockThreshold: input.lowStockThreshold,
      currentStock: 0
    };
    this.inventoryItems.push(newItem);
    return newItem;
  }

  public getStockMovements(itemId?: string): StockMovement[] {
    let movements = [...this.stockMovements];
    if (itemId) {
      movements = movements.filter((m) => m.itemId === itemId);
    }
    return movements.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  public recordStockMovement(input: {
    itemId: string;
    movementType: MovementType;
    quantity: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }): StockMovement {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Viewer sessions cannot record stock movements', 403);
    }
    const item = this.inventoryItems.find((i) => i.id === input.itemId);
    if (!item) this.createError('NOT_FOUND', 'Item not found', 404);

    const movement: StockMovement = {
      id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: input.itemId,
      itemName: item.name,
      recordedBy: this.currentUser.id,
      recordedByName: this.currentUser.name,
      movementType: input.movementType,
      quantity: input.quantity,
      referenceType: input.referenceType || 'manual',
      referenceId: input.referenceId,
      recordedAt: new Date().toISOString(),
      notes: input.notes
    };

    this.stockMovements.unshift(movement);
    this.recomputeStock(input.itemId);
    return movement;
  }

  // PRODUCTION MODULE
  public getJobs(params?: { status?: string; search?: string }): Job[] {
    let list = [...this.jobs];
    if (params?.status && params.status !== 'all') {
      list = list.filter((j) => j.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (j) =>
          j.description.toLowerCase().includes(q) ||
          j.customerName?.toLowerCase().includes(q) ||
          j.finishedGoodName?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getJob(id: string): Job {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) this.createError('NOT_FOUND', 'Job not found', 404);
    return job;
  }

  public createJob(input: {
    description: string;
    targetQuantity: number;
    orderId?: string | null;
    finishedGoodId?: string | null;
    targetCompletionDate: string;
  }): Job {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Viewer sessions cannot create jobs', 403);
    }

    let customerName: string | undefined;
    if (input.orderId) {
      const order = this.orders.find((o) => o.id === input.orderId);
      if (order) {
        customerName = order.customerName;
        order.linkedJobsCount = (order.linkedJobsCount || 0) + 1;
      }
    }

    let finishedGoodName: string | undefined;
    if (input.finishedGoodId) {
      const fg = this.inventoryItems.find((i) => i.id === input.finishedGoodId);
      if (fg) finishedGoodName = fg.name;
    }

    const newJob: Job = {
      id: `job-${Date.now()}`,
      description: input.description,
      targetQuantity: input.targetQuantity,
      producedQuantity: 0,
      status: 'Pending',
      targetCompletionDate: input.targetCompletionDate,
      version: 1,
      orderId: input.orderId || null,
      customerName: customerName || null,
      finishedGoodId: input.finishedGoodId || null,
      finishedGoodName: finishedGoodName || null,
      createdBy: this.currentUser.id,
      createdByName: this.currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productionRuns: []
    };

    this.jobs.unshift(newJob);
    return newJob;
  }

  public updateJob(id: string, input: { status?: Job['status']; description?: string; targetCompletionDate?: string; version: number }): Job {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Viewer sessions cannot update jobs', 403);
    }
    const job = this.jobs.find((j) => j.id === id);
    if (!job) this.createError('NOT_FOUND', 'Job not found', 404);

    // Optimistic Concurrency Control (NFR-4.1)
    if (job.version !== input.version) {
      this.createError('CONFLICT', 'Conflict: This job was updated by another owner. Please refresh and reapply your change.', 409);
    }

    if (input.status) job.status = input.status;
    if (input.description) job.description = input.description;
    if (input.targetCompletionDate) job.targetCompletionDate = input.targetCompletionDate;
    job.version += 1;
    job.updatedAt = new Date().toISOString();

    return job;
  }

  public logProductionRun(
    jobId: string,
    input: { quantityProduced: number; materialsConsumed: { itemId: string; quantity: number }[] }
  ): ProductionRun {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Viewer sessions cannot log production runs', 403);
    }
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) this.createError('NOT_FOUND', 'Job not found', 404);

    const runId = `run-${Date.now()}`;
    const runDate = new Date().toISOString();

    // 1. Record materials consumed (StockMovements)
    const consumedRecords: MaterialConsumedRecord[] = [];
    for (const mat of input.materialsConsumed) {
      const item = this.inventoryItems.find((i) => i.id === mat.itemId);
      if (item) {
        this.recordStockMovement({
          itemId: mat.itemId,
          movementType: 'consumption',
          quantity: -Math.abs(mat.quantity),
          referenceType: 'production_run',
          referenceId: runId,
          notes: `Consumed for Job: ${job.description}`
        });

        consumedRecords.push({
          id: `prm-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          productionRunId: runId,
          itemId: mat.itemId,
          itemName: item.name,
          unitOfMeasure: item.unitOfMeasure,
          quantityConsumed: mat.quantity
        });
      }
    }

    // 2. If finished good produced > 0, record receipt movement
    if (input.quantityProduced > 0 && job.finishedGoodId) {
      const fg = this.inventoryItems.find((i) => i.id === job.finishedGoodId);
      if (fg) {
        this.recordStockMovement({
          itemId: job.finishedGoodId,
          movementType: 'receipt',
          quantity: input.quantityProduced,
          referenceType: 'production_run',
          referenceId: runId,
          notes: `Output from Job: ${job.description}`
        });
      }
    }

    // 3. Update job produced quantity & status if targets met
    job.producedQuantity += input.quantityProduced;
    if (job.producedQuantity >= job.targetQuantity && job.status === 'In Progress') {
      job.status = 'Completed';
    } else if (job.status === 'Pending' && input.quantityProduced > 0) {
      job.status = 'In Progress';
    }
    job.updatedAt = runDate;

    const run: ProductionRun = {
      id: runId,
      jobId,
      loggedBy: this.currentUser.id,
      loggedByName: this.currentUser.name,
      quantityProduced: input.quantityProduced,
      runDate,
      materialsConsumed: consumedRecords
    };

    if (!job.productionRuns) job.productionRuns = [];
    job.productionRuns.unshift(run);

    return run;
  }

  // ORDERS MODULE
  public getCustomers(search?: string): Customer[] {
    if (search) {
      const q = search.toLowerCase();
      return this.customers.filter((c) => c.name.toLowerCase().includes(q) || c.contactInfo.toLowerCase().includes(q));
    }
    return this.customers;
  }

  public createCustomer(input: { name: string; contactInfo: string }): Customer {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Viewer sessions cannot create customers', 403);
    }
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: input.name,
      contactInfo: input.contactInfo,
      createdAt: new Date().toISOString()
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  public getOrders(params?: { status?: string; search?: string }): Order[] {
    let list = [...this.orders];
    if (params?.status && params.status !== 'all') {
      list = list.filter((o) => o.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(q) ||
          o.lineItems.some((li) => li.finishedGoodName?.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrder(id: string): Order {
    const order = this.orders.find((o) => o.id === id);
    if (!order) this.createError('NOT_FOUND', 'Order not found', 404);
    return order;
  }

  public createOrder(input: {
    customerId: string;
    lineItems: { finishedGoodId: string; quantity: number; specNotes?: string }[];
    requestedDeliveryDate: string;
  }): Order {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Viewer sessions cannot create orders', 403);
    }
    const customer = this.customers.find((c) => c.id === input.customerId);
    if (!customer) this.createError('NOT_FOUND', 'Customer not found', 404);

    const orderId = `ord-${Date.now()}`;
    const lineItems = input.lineItems.map((li, idx) => {
      const fg = this.inventoryItems.find((i) => i.id === li.finishedGoodId);
      return {
        id: `oli-${Date.now()}-${idx}`,
        orderId,
        finishedGoodId: li.finishedGoodId,
        finishedGoodName: fg ? fg.name : 'Finished Good',
        quantity: li.quantity,
        specNotes: li.specNotes
      };
    });

    const newOrder: Order = {
      id: orderId,
      customerId: input.customerId,
      customerName: customer.name,
      createdBy: this.currentUser.id,
      createdByName: this.currentUser.name,
      status: 'Received',
      requestedDeliveryDate: input.requestedDeliveryDate,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lineItems,
      linkedJobsCount: 0
    };

    this.orders.unshift(newOrder);
    return newOrder;
  }

  public updateOrder(id: string, input: { status?: Order['status']; version: number }): Order {
    if (this.currentUser.role !== 'owner') {
      this.createError('FORBIDDEN', 'Viewer sessions cannot update orders', 403);
    }
    const order = this.orders.find((o) => o.id === id);
    if (!order) this.createError('NOT_FOUND', 'Order not found', 404);

    // Optimistic Concurrency Control (NFR-4.1)
    if (order.version !== input.version) {
      this.createError('CONFLICT', 'Conflict: This order was updated by another owner. Please refresh and reapply your change.', 409);
    }

    if (input.status) order.status = input.status;
    order.version += 1;
    order.updatedAt = new Date().toISOString();

    return order;
  }

  // TREND REPORTS (FR-6.1 to FR-6.5)
  public getProductionReport(rangeDays = 30): ProductionReportSeries[] {
    const dates: ProductionReportSeries[] = [];
    const now = new Date();

    for (let i = rangeDays - 1; i >= 0; i -= Math.ceil(rangeDays / 10)) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const period = d.toISOString().split('T')[0];

      // Aggregate mock metrics
      const unitsProduced = 20 + Math.floor(Math.sin(i) * 15 + Math.random() * 20);
      const jobsCompleted = Math.max(0, Math.floor(unitsProduced / 25));
      const avgCompletionDays = Number((2.5 + Math.sin(i * 0.5) * 0.8).toFixed(1));

      dates.push({
        period,
        unitsProduced,
        jobsCompleted,
        avgCompletionDays
      });
    }

    return dates;
  }

  public getInventoryReport(rangeDays = 30): InventoryReportSeries[] {
    const series: InventoryReportSeries[] = [];
    const now = new Date();

    for (let i = rangeDays - 1; i >= 0; i -= Math.ceil(rangeDays / 10)) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const period = d.toISOString().split('T')[0];

      const consumed = 35 + Math.floor(Math.sin(i * 0.4) * 20 + Math.random() * 10);
      const received = (i % 3 === 0) ? 100 : 10;
      const netChange = received - consumed;

      series.push({
        period,
        consumed,
        received,
        netChange
      });
    }

    return series;
  }

  public getOrderReport(rangeDays = 30): OrderReportSeries[] {
    const series: OrderReportSeries[] = [];
    const now = new Date();

    for (let i = rangeDays - 1; i >= 0; i -= Math.ceil(rangeDays / 10)) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const period = d.toISOString().split('T')[0];

      const orderCount = Math.floor(Math.random() * 5) + 1;
      const onTimeRate = Math.min(100, Math.max(80, Math.floor(92 + Math.sin(i) * 8)));
      const cancelledCount = Math.random() > 0.8 ? 1 : 0;

      series.push({
        period,
        orderCount,
        onTimeRate,
        cancelledCount
      });
    }

    return series;
  }
}

export const mockServer = new MockServer();
