import { Customer, InventoryItem, Job, Order, StockMovement, User } from '../types/domain';

export const initialUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Robert Vance (Owner)',
    email: 'owner@metalworks.com',
    role: 'owner',
    active: true
  },
  {
    id: 'usr-2',
    name: 'Elena Rostova (Viewer)',
    email: 'viewer@metalworks.com',
    role: 'viewer',
    active: true
  },
  {
    id: 'usr-3',
    name: 'Marcus Brody (Owner)',
    email: 'marcus@metalworks.com',
    role: 'owner',
    active: true
  }
];

export const initialInventoryItems: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Aluminum Sheet 6061-T6 (4x8ft 3mm)',
    itemType: 'raw_material',
    unitOfMeasure: 'sheets',
    lowStockThreshold: 25,
    currentStock: 18 // Low stock alert!
  },
  {
    id: 'inv-2',
    name: 'Extruded Aluminum Profile 40x40mm (6m)',
    itemType: 'raw_material',
    unitOfMeasure: 'bars',
    lowStockThreshold: 40,
    currentStock: 120
  },
  {
    id: 'inv-3',
    name: 'Stainless Steel Fastener Rod M12 (3m)',
    itemType: 'raw_material',
    unitOfMeasure: 'rods',
    lowStockThreshold: 15,
    currentStock: 8 // Low stock alert!
  },
  {
    id: 'inv-4',
    name: 'Industrial Powder Coating Paint (Titanium Grey)',
    itemType: 'raw_material',
    unitOfMeasure: 'kg',
    lowStockThreshold: 50,
    currentStock: 85
  },
  {
    id: 'inv-5',
    name: 'Aluminum Bracket Assembly (Model #4471)',
    itemType: 'finished_good',
    unitOfMeasure: 'units',
    lowStockThreshold: 50,
    currentStock: 140
  },
  {
    id: 'inv-6',
    name: 'Architectural Ventilation Louver Panel 1x2m',
    itemType: 'finished_good',
    unitOfMeasure: 'panels',
    lowStockThreshold: 10,
    currentStock: 15
  },
  {
    id: 'inv-7',
    name: 'Precision NEMA Enclosure Chassis',
    itemType: 'finished_good',
    unitOfMeasure: 'units',
    lowStockThreshold: 20,
    currentStock: 5 // Low stock alert!
  }
];

export const initialStockMovements: StockMovement[] = [
  {
    id: 'sm-1',
    itemId: 'inv-1',
    itemName: 'Aluminum Sheet 6061-T6 (4x8ft 3mm)',
    recordedBy: 'usr-1',
    recordedByName: 'Robert Vance (Owner)',
    movementType: 'receipt',
    quantity: 100,
    referenceType: 'manual',
    referenceId: 'PO-2026-088',
    recordedAt: '2026-07-15T09:00:00Z',
    notes: 'Initial stock intake from Kaiser Aluminum'
  },
  {
    id: 'sm-2',
    itemId: 'inv-1',
    itemName: 'Aluminum Sheet 6061-T6 (4x8ft 3mm)',
    recordedBy: 'usr-1',
    recordedByName: 'Robert Vance (Owner)',
    movementType: 'consumption',
    quantity: -82,
    referenceType: 'production_run',
    referenceId: 'run-101',
    recordedAt: '2026-08-01T14:30:00Z',
    notes: 'Consumed for Bracket #4471 Production Batch #1'
  },
  {
    id: 'sm-3',
    itemId: 'inv-5',
    itemName: 'Aluminum Bracket Assembly (Model #4471)',
    recordedBy: 'usr-1',
    recordedByName: 'Robert Vance (Owner)',
    movementType: 'receipt',
    quantity: 140,
    referenceType: 'production_run',
    referenceId: 'run-101',
    recordedAt: '2026-08-01T14:30:00Z',
    notes: 'Finished Goods output from Job #JOB-101'
  },
  {
    id: 'sm-4',
    itemId: 'inv-2',
    itemName: 'Extruded Aluminum Profile 40x40mm (6m)',
    recordedBy: 'usr-3',
    recordedByName: 'Marcus Brody (Owner)',
    movementType: 'receipt',
    quantity: 150,
    referenceType: 'manual',
    referenceId: 'PO-2026-092',
    recordedAt: '2026-07-20T11:15:00Z',
    notes: 'Supplier shipment received'
  },
  {
    id: 'sm-5',
    itemId: 'inv-2',
    itemName: 'Extruded Aluminum Profile 40x40mm (6m)',
    recordedBy: 'usr-3',
    recordedByName: 'Marcus Brody (Owner)',
    movementType: 'consumption',
    quantity: -30,
    referenceType: 'production_run',
    referenceId: 'run-102',
    recordedAt: '2026-08-03T16:00:00Z',
    notes: 'Louver framing run'
  },
  {
    id: 'sm-6',
    itemId: 'inv-3',
    itemName: 'Stainless Steel Fastener Rod M12 (3m)',
    recordedBy: 'usr-1',
    recordedByName: 'Robert Vance (Owner)',
    movementType: 'adjustment',
    quantity: -2,
    referenceType: 'manual',
    referenceId: 'AUDIT-2026-08',
    recordedAt: '2026-08-05T08:30:00Z',
    notes: 'Scrap adjustment due to thread damage during machining'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Apex Construction Dynamics',
    contactInfo: 'procurement@apexconstruction.com | +1 (555) 234-8890',
    createdAt: '2026-05-10T10:00:00Z'
  },
  {
    id: 'cust-2',
    name: 'Titan Heavy Industrial Systems',
    contactInfo: 'orders@titanindustrial.io | +1 (555) 987-1234',
    createdAt: '2026-06-01T14:20:00Z'
  },
  {
    id: 'cust-3',
    name: 'Metro Architectural Facades Ltd',
    contactInfo: 'supply@metrofacades.org | +1 (555) 345-6789',
    createdAt: '2026-06-18T16:45:00Z'
  }
];

export const initialOrders: Order[] = [
  {
    id: 'ord-1',
    customerId: 'cust-1',
    customerName: 'Apex Construction Dynamics',
    createdBy: 'usr-1',
    createdByName: 'Robert Vance (Owner)',
    status: 'In Production',
    requestedDeliveryDate: '2026-08-18',
    version: 1,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
    linkedJobsCount: 1,
    lineItems: [
      {
        id: 'oli-1',
        orderId: 'ord-1',
        finishedGoodId: 'inv-5',
        finishedGoodName: 'Aluminum Bracket Assembly (Model #4471)',
        quantity: 200,
        specNotes: 'Anodized silver finish, structural rating Class A'
      }
    ]
  },
  {
    id: 'ord-2',
    customerId: 'cust-2',
    customerName: 'Titan Heavy Industrial Systems',
    createdBy: 'usr-3',
    createdByName: 'Marcus Brody (Owner)',
    status: 'Received',
    requestedDeliveryDate: '2026-08-25',
    version: 1,
    createdAt: '2026-08-04T15:30:00Z',
    updatedAt: '2026-08-04T15:30:00Z',
    linkedJobsCount: 0,
    lineItems: [
      {
        id: 'oli-2',
        orderId: 'ord-2',
        finishedGoodId: 'inv-7',
        finishedGoodName: 'Precision NEMA Enclosure Chassis',
        quantity: 50,
        specNotes: 'IP66 gasketed seal required'
      }
    ]
  },
  {
    id: 'ord-3',
    customerId: 'cust-3',
    customerName: 'Metro Architectural Facades Ltd',
    createdBy: 'usr-1',
    createdByName: 'Robert Vance (Owner)',
    status: 'Ready for Delivery',
    requestedDeliveryDate: '2026-08-10',
    version: 2,
    createdAt: '2026-07-28T09:15:00Z',
    updatedAt: '2026-08-05T16:00:00Z',
    linkedJobsCount: 1,
    lineItems: [
      {
        id: 'oli-3',
        orderId: 'ord-3',
        finishedGoodId: 'inv-6',
        finishedGoodName: 'Architectural Ventilation Louver Panel 1x2m',
        quantity: 15,
        specNotes: 'Powder coat Titanium Grey RAL 7016'
      }
    ]
  }
];

export const initialJobs: Job[] = [
  {
    id: 'job-1',
    description: 'Fabricate 200 units Aluminum Brackets for Order #ord-1',
    targetQuantity: 200,
    producedQuantity: 140,
    status: 'In Progress',
    targetCompletionDate: '2026-08-12',
    version: 2,
    orderId: 'ord-1',
    customerName: 'Apex Construction Dynamics',
    finishedGoodId: 'inv-5',
    finishedGoodName: 'Aluminum Bracket Assembly (Model #4471)',
    createdBy: 'usr-1',
    createdByName: 'Robert Vance (Owner)',
    createdAt: '2026-08-01T11:00:00Z',
    updatedAt: '2026-08-01T14:30:00Z',
    productionRuns: [
      {
        id: 'run-101',
        jobId: 'job-1',
        loggedBy: 'usr-1',
        loggedByName: 'Robert Vance (Owner)',
        quantityProduced: 140,
        runDate: '2026-08-01T14:30:00Z',
        materialsConsumed: [
          {
            id: 'prm-1',
            productionRunId: 'run-101',
            itemId: 'inv-1',
            itemName: 'Aluminum Sheet 6061-T6 (4x8ft 3mm)',
            unitOfMeasure: 'sheets',
            quantityConsumed: 82
          }
        ]
      }
    ]
  },
  {
    id: 'job-2',
    description: 'Extrude & Assemble Architectural Louver Panels',
    targetQuantity: 15,
    producedQuantity: 15,
    status: 'Completed',
    targetCompletionDate: '2026-08-04',
    version: 1,
    orderId: 'ord-3',
    customerName: 'Metro Architectural Facades Ltd',
    finishedGoodId: 'inv-6',
    finishedGoodName: 'Architectural Ventilation Louver Panel 1x2m',
    createdBy: 'usr-3',
    createdByName: 'Marcus Brody (Owner)',
    createdAt: '2026-08-02T08:00:00Z',
    updatedAt: '2026-08-03T16:00:00Z',
    productionRuns: [
      {
        id: 'run-102',
        jobId: 'job-2',
        loggedBy: 'usr-3',
        loggedByName: 'Marcus Brody (Owner)',
        quantityProduced: 15,
        runDate: '2026-08-03T16:00:00Z',
        materialsConsumed: [
          {
            id: 'prm-2',
            productionRunId: 'run-102',
            itemId: 'inv-2',
            itemName: 'Extruded Aluminum Profile 40x40mm (6m)',
            unitOfMeasure: 'bars',
            quantityConsumed: 30
          }
        ]
      }
    ]
  },
  {
    id: 'job-3',
    description: 'Speculative Buffer Stock: Precision NEMA Chassis',
    targetQuantity: 30,
    producedQuantity: 0,
    status: 'Pending',
    targetCompletionDate: '2026-08-20',
    version: 1,
    orderId: null,
    customerName: null,
    finishedGoodId: 'inv-7',
    finishedGoodName: 'Precision NEMA Enclosure Chassis',
    createdBy: 'usr-1',
    createdByName: 'Robert Vance (Owner)',
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-05T10:00:00Z',
    productionRuns: []
  }
];
