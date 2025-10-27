import { z } from 'zod';

// THE FIX: Define client-safe objects that mirror the Prisma enums.
// This removes the server-only '@prisma/client' import.
const MaterialCategory = {
  LEATHER: "LEATHER",
  THREAD: "THREAD",
  HARDWARE: "HARDWARE",
  PACKAGING: "PACKAGING",
  TOOLS: "TOOLS",
  CONSUMABLE: "CONSUMABLE",
  OTHER: "OTHER",
} as const;

const OrderStatus = {
  QUOTE: "QUOTE",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  SHIPPED: "SHIPPED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

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
  overheadRate: z.coerce.number().min(0, 'Overhead must be a positive number.'),
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

// --- Material & Inventory Schemas ---
export const createMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  category: z.nativeEnum(MaterialCategory),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required.'),
  stockLevel: z.coerce.number().int().default(0),
  stockAlertThreshold: z.coerce.number().int().default(0),
  unitCost: z.coerce.number().min(0).default(0),
  supplierName: z.string().optional(),
  supplierUrl: z.string().url().or(z.literal('')).optional(),
});

// --- Pattern Schemas ---
const fileSchema = z.object({
  fileData: z.string().startsWith('data:', { message: 'Invalid file data.' }),
  fileName: z.string().min(1, 'File name is required.'),
});

export const createPatternSchema = z.object({
  name: z.string().min(1, 'Pattern name is required.'),
  description: z.string().optional(),
  tags: z.string().optional(),
  files: z.array(fileSchema).min(1, 'At least one file is required.'),
});

export const updatePatternSchema = createPatternSchema.extend({
  files: z.array(fileSchema).optional(),
});

// --- Product Schemas ---
const bomItemSchema = z.object({
  materialId: z.string().min(1, "Please select a material."),
  quantity: z.coerce.number().positive(),
  scrapFactor: z.coerce.number().min(0).max(1),
});

const routeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  operationId: z.string().min(1, "Please select an operation."),
  estimatedTimeMin: z.coerce.number().int().positive(),
  toolId: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  sku: z.string().optional(),
  description: z.string().optional(),
  patternId: z.string().optional(),
  sellingPrice: z.coerce.number().min(0),
  version: z.object({
    notes: z.string().optional(),
    estimatedLaborMinutes: z.coerce.number().int().min(0),
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

// --- ADD NEW FEEDBACK SCHEMA ---
export const createFeedbackSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Please provide a more detailed description.'),
  category: z.enum(['FEATURE_REQUEST', 'BUG_REPORT', 'GENERAL']),
});