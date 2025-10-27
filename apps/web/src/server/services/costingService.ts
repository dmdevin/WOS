import { Prisma } from '@prisma/client';
//import { prisma } from '../db';

//import { Prisma } from '@prisma/client';

// The input type is updated: we no longer need 'lots' in the include.
type ProductVersionWithDetails = Prisma.ProductVersionGetPayload<{
    include: {
        bomItems: { include: { material: true } };
    };
}>;

type WorkshopSettings = Prisma.WorkshopSettingsGetPayload<{}>;

export async function calculateProductCost(
    productVersion: ProductVersionWithDetails,
    settings: WorkshopSettings
) {
    // 1. Calculate Material Cost
    // THE FIX: Simplified logic uses the direct 'unitCost' from the material.
    const materialCost = productVersion.bomItems.reduce((acc, item) => {
        const unitCost = item.material.unitCost;
        const quantity = item.quantity;
        const scrapFactor = item.scrapFactor;

        // Cost = (Quantity * Unit Cost) * (1 + Scrap Factor)
        const requiredQty = new Prisma.Decimal(quantity).times(new Prisma.Decimal(1).add(scrapFactor));
        const costForItem = requiredQty.times(unitCost);

        return acc.add(costForItem);
    }, new Prisma.Decimal(0));

    // 2. Calculate Labor Cost
    const laborCost = new Prisma.Decimal(productVersion.estimatedLaborMinutes).div(60).times(settings.laborRate);

    // 3. Calculate Overhead Cost
    const overheadCost = laborCost.times(settings.overheadRate.div(100));

    // 4. Calculate Total Cost
    const totalCost = materialCost.add(laborCost).add(overheadCost);

    // 5. Return all values as standard numbers for the client.
    return {
        materialCost: totalCost.isZero() ? 0 : materialCost.toNumber(),
        laborCost: totalCost.isZero() ? 0 : laborCost.toNumber(),
        overheadCost: totalCost.isZero() ? 0 : overheadCost.toNumber(),
        totalCost: totalCost.toNumber(),
    };
}