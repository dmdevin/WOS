import { z } from 'zod';
import { MaterialCategory, OrderStatus } from '@prisma/client';

// --- User & Auth Schemas ---
export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

// --- Workshop Schemas ---
export const createWorkshopSchema = z.object({
  name: z.string().min(1, 'Workshop name is required.'),
});

// --- Settings Schemas ---
export const updateSettingsSchema = z.object({
  laborRate: z.coerce.number().min(0, 'Labor rate must be a positive number.'),
  currency: z.string().length(3, 'Currency code must be 3 characters.'),
});

// --- Customer Schemas ---
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
export type TCustomerSchema = z.infer<typeof customerSchema>;

// --- Material & Inventory Schemas ---
export const createMaterialSchema = z.object({
  name: z.string().min(1),
  category: z.nativeEnum(MaterialCategory),
  unitOfMeasure: z.string().min(1),
  reorderPoint: z.coerce.number().optional(),
});

export const receiveLotSchema = z.object({
  materialId: z.string(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0.'),
  costPerUnit: z.coerce.number().positive('Cost must be greater than 0.'),
  supplier: z.string().optional(),
  lotNumber: z.string().optional(),
});

// --- Product Schemas ---
const bomItemSchema = z.object({
  materialId: z.string(),
  quantity: z.coerce.number().positive(),
  scrapFactor: z.coerce.number().min(0).max(1),
});

const routeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  operationId: z.string(),
  estimatedTimeMin: z.coerce.number().int().positive(),
  toolId: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  sku: z.string().optional(),
  description: z.string().optional(),
  // Includes the first version
  version: z.object({
    notes: z.string().optional(),
    bomItems: z.array(bomItemSchema).min(1, 'At least one material is required.'),
    routing: z.array(routeStepSchema).min(1, 'At least one routing step is required.'),
  }),
});

// --- Order Schemas ---
export const orderItemSchema = z.object({
  productVersionId: z.string(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
});

export const createOrderSchema = z.object({
  customerId: z.string(),
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional(),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.QUOTE),
});