import { createTRPCRouter, protectedWorkshopProcedure } from '@/server/api/trpc';

// Define the enums as client-safe objects to avoid direct prisma imports
const WorkflowStage = {
  PENDING: "PENDING",
  CUTTING: "CUTTING",
  SKIVING: "SKIVING",
  STITCHING: "STITCHING",
  FINISHING: "FINISHING",
  PACKING: "PACKING",
  SHIPPED: "SHIPPED",
} as const;

type TopProductGroupBy = {
    productVersionId: string;
    _sum: {
        quantity: number | null;
    };
};

type MaterialForStockCheck = {
    id: string;
    name: string;
    stockLevel: number;
    stockAlertThreshold: number;
};

export const analyticsRouter = createTRPCRouter({
  getKpis: protectedWorkshopProcedure.query(async ({ ctx }) => {
    const workshopId = ctx.workshopId;

    // 1. Total Revenue from shipped orders
    const revenueData = await ctx.prisma.order.aggregate({
      _sum: {
        totalPrice: true,
      },
      where: {
        workshopId,
        // --- THE FIX: Use `workflowStage` instead of `status` ---
        workflowStage: {
          in: [WorkflowStage.SHIPPED],
        },
      },
    });

    // 2. Count of orders currently in production (not pending, not shipped)
    const ordersInProgress = await ctx.prisma.order.count({
      where: {
        workshopId,
        // --- THE FIX: Use `workflowStage` with appropriate values ---
        workflowStage: {
          in: [
            WorkflowStage.CUTTING,
            WorkflowStage.SKIVING,
            WorkflowStage.STITCHING,
            WorkflowStage.FINISHING,
            WorkflowStage.PACKING,
          ],
        },
      },
    });

    // 3. Stock Alerts
    const materialsToCheck = await ctx.prisma.material.findMany({
        where: { 
            workshopId,
            stockAlertThreshold: { gt: 0 },
        },
        select: {
            id: true,
            name: true,
            stockLevel: true,
            stockAlertThreshold: true,
        }
    });
    const lowStockMaterials = materialsToCheck.filter((m: MaterialForStockCheck) => m.stockLevel < m.stockAlertThreshold);

    // 4. Top 5 selling products (from non-pending orders)
    const topProducts = await ctx.prisma.orderItem.groupBy({
        by: ['productVersionId'],
        _sum: {
            quantity: true,
        },
        where: {
            order: {
                workshopId,
                // --- THE FIX: Use `workflowStage` instead of `status` ---
                workflowStage: { notIn: [WorkflowStage.PENDING] },
            },
        },
        orderBy: {
            _sum: {
                quantity: 'desc',
            },
        },
        take: 5,
    });
    
    // Enrich top products with names
    const enrichedTopProducts = await Promise.all(
        topProducts.map(async (p: TopProductGroupBy) => {
            const pv = await ctx.prisma.productVersion.findUnique({
                where: { id: p.productVersionId },
                include: { product: { select: { name: true } } }
            });
            return {
                productName: pv?.product.name ?? 'Unknown Product',
                quantitySold: p._sum.quantity ?? 0,
            }
        })
    );

    return {
      totalRevenue: revenueData._sum.totalPrice?.toNumber() ?? 0,
      ordersInProgress: ordersInProgress,
      stockAlertsCount: lowStockMaterials.length,
      stockAlertItems: lowStockMaterials.map((m: MaterialForStockCheck) => ({ id: m.id, name: m.name })),
      topProducts: enrichedTopProducts,
    };
  }),
});