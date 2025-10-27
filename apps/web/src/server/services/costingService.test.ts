import { describe, it, expect, vi } from 'vitest';
import { calculateProductCost } from './costingService';
import { Decimal } from '@prisma/client/runtime/library';

// Mock data closely resembling Prisma's output
const mockSettings = {
  id: 'settings1',
  workshopId: 'ws1',
  laborRate: new Decimal(40), // $40/hr
  currency: 'USD',
  unitSystem: 'imperial',
};

const mockProductVersion = {
  id: 'pv1',
  bomItems: [
    { // Leather
      material: { lots: [{ currentQty: new Decimal(10), costPerUnit: new Decimal(10) }] },
      quantity: new Decimal(2), // 2 sqft
      scrapFactor: new Decimal(0.1), // 10%
    },
    { // Thread
      material: { lots: [{ currentQty: new Decimal(100), costPerUnit: new Decimal(0.2) }] },
      quantity: new Decimal(5), // 5 meters
      scrapFactor: new Decimal(0.0),
    },
  ],
  routing: [
    { estimatedTimeMin: 30, tool: null }, // 30 mins
    { estimatedTimeMin: 30, tool: null }, // 30 mins
  ],
};

describe('costingService', () => {
  it('should calculate unit cost correctly', async () => {
    // @ts-ignore - Mocking a complex type for simplicity
    const cost = await calculateProductCost(mockProductVersion, mockSettings);

    // Material Cost:
    // Leather: 2 * (1 + 0.1) * 10 = 2.2 * 10 = $22
    // Thread: 5 * (1 + 0.0) * 0.2 = 5 * 0.2 = $1
    // Total Material: $23
    expect(cost.materialCost).toBeCloseTo(23);

    // Labor Cost:
    // Total time: 30 + 30 = 60 mins = 1 hour
    // Labor cost: 1 hr * $40/hr = $40
    expect(cost.laborCost).toBeCloseTo(40);

    // Tool Cost (should be 0 as no tools are used)
    expect(cost.toolCost).toBe(0);

    // Total Unit Cost
    // 23 + 40 + 0 = $63
    expect(cost.totalUnitCost).toBeCloseTo(63);
  });
});