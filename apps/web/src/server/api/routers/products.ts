import { z } from 'zod';
import { createTRPCRouter, protectedWorkshopProcedure } from '@/server/api/trpc';
import { calculateProductCost } from '@/server/services/costingService';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { createProductSchema } from '@/lib/validators';

export type ProductListOutput = Prisma.ProductGetPayload<{
  include: { versions: { orderBy: { version: 'desc' }, take: 1 } };
}>[];

export type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    versions: {
      include: {
        bomItems: { include: { material: true } };
        routing: { include: { operation: true; tool: true } };
      };
      orderBy: { version: 'desc' };
    };
  };
}>;

export const productsRouter = createTRPCRouter({
  create: protectedWorkshopProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { version, workshopId, ...productData } = input as any;
      
      return ctx.prisma.product.create({
        data: {
          ...productData,
          workshopId: ctx.workshopId,
          versions: {
            create: {
              version: 1,
              notes: version.notes,
              estimatedLaborMinutes: version.estimatedLaborMinutes,
              bomItems: { create: version.bomItems },
              routing: { create: version.routing },
            },
          },
        },
      });
    }),

  list: protectedWorkshopProcedure.query(async ({ ctx }): Promise<ProductListOutput> => {
    return ctx.prisma.product.findMany({
      where: { workshopId: ctx.workshopId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      orderBy: { name: 'asc' },
    });
  }),

  getById: protectedWorkshopProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }): Promise<ProductWithDetails | null> => {
      return ctx.prisma.product.findFirst({
        where: { id: input.productId, workshopId: ctx.workshopId },
        include: {
          versions: {
            include: {
              bomItems: { include: { material: true } },
              routing: { include: { operation: true, tool: true } },
            },
            orderBy: { version: 'desc' },
          },
        },
      });
    }),
  
  getCosting: protectedWorkshopProcedure
    .input(z.object({ productVersionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const productVersion = await ctx.prisma.productVersion.findFirst({
        where: { id: input.productVersionId, product: { workshopId: ctx.workshopId } },
        include: {
          // THE FIX: Removed { include: { lots: true } }
          bomItems: { include: { material: true } },
          product: true,
        },
      });
      if (!productVersion) throw new TRPCError({ code: 'NOT_FOUND' });

      const settings = await ctx.prisma.workshopSettings.findUnique({ where: { workshopId: ctx.workshopId } });
      if (!settings) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workshop settings not configured.' });

      const costBreakdown = await calculateProductCost(productVersion, settings);
      const sellingPrice = productVersion.product.sellingPrice.toNumber();

      const marginAmount = sellingPrice - costBreakdown.totalCost;
      const marginPercentage = sellingPrice > 0 ? (marginAmount / sellingPrice) * 100 : 0;

      return {
        ...costBreakdown,
        sellingPrice,
        marginAmount,
        marginPercentage,
      };
    }),
});