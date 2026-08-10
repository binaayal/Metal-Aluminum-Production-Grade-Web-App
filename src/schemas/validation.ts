import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const CreateJobSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  targetQuantity: z.number({ invalid_type_error: 'Target quantity is required' }).int().positive('Target quantity must be greater than 0'),
  orderId: z.string().nullable().optional(),
  finishedGoodId: z.string().nullable().optional(),
  targetCompletionDate: z.string().min(1, 'Target completion date is required')
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const UpdateJobSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'On Hold', 'Completed', 'Cancelled']).optional(),
  description: z.string().min(3).optional(),
  targetCompletionDate: z.string().optional(),
  version: z.number().int()
});

export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

export const MaterialConsumptionSchema = z.object({
  itemId: z.string().min(1, 'Select a material'),
  quantity: z.number({ invalid_type_error: 'Quantity is required' }).positive('Quantity must be greater than 0')
});

export const LogProductionRunSchema = z.object({
  quantityProduced: z.number({ invalid_type_error: 'Quantity produced is required' }).int().nonnegative('Quantity produced cannot be negative'),
  materialsConsumed: z.array(MaterialConsumptionSchema)
});

export type LogProductionRunInput = z.infer<typeof LogProductionRunSchema>;

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  itemType: z.enum(['raw_material', 'finished_good']),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required (e.g., kg, sheets, units)'),
  lowStockThreshold: z.number({ invalid_type_error: 'Low stock threshold is required' }).nonnegative('Threshold cannot be negative')
});

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;

export const RecordMovementSchema = z.object({
  itemId: z.string().min(1, 'Select an item'),
  movementType: z.enum(['receipt', 'consumption', 'adjustment', 'shipment']),
  quantity: z.number({ invalid_type_error: 'Quantity is required' }).refine((val) => val !== 0, {
    message: 'Quantity cannot be 0'
  }),
  notes: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.movementType === 'receipt' && data.quantity <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Receipt quantity must be positive (> 0)',
      path: ['quantity']
    });
  } else if ((data.movementType === 'consumption' || data.movementType === 'shipment') && data.quantity >= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${data.movementType === 'consumption' ? 'Consumption' : 'Shipment'} quantity must be negative (< 0)`,
      path: ['quantity']
    });
  }
});

export type RecordMovementInput = z.infer<typeof RecordMovementSchema>;

export const OrderLineItemSchema = z.object({
  finishedGoodId: z.string().min(1, 'Select a finished good'),
  quantity: z.number({ invalid_type_error: 'Quantity is required' }).int().positive('Quantity must be greater than 0'),
  specNotes: z.string().optional()
});

export const CreateOrderSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  lineItems: z.array(OrderLineItemSchema).min(1, 'At least one line item is required'),
  requestedDeliveryDate: z.string().min(1, 'Requested delivery date is required')
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z.object({
  status: z.enum(['Received', 'In Production', 'Ready for Delivery', 'Fulfilled', 'Cancelled']).optional(),
  version: z.number().int()
});

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  contactInfo: z.string().min(3, 'Contact info is required (email or phone)')
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['owner', 'viewer'])
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['owner', 'viewer']).optional(),
  active: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
