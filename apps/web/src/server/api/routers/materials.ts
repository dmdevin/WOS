import { z } from 'zod';
import { createTRPCRouter, protectedWorkshopProcedure } from '@/server/api/trpc';
import { createMaterialSchema } from '@/lib/validators';
import { TRPCError } from '@trpc/server';
import { Prisma, Material } from '@prisma/client';

// THE FIX: Create a new type by removing the original 'unitCost' (a Decimal)
// and adding it back as a 'number'.
export type MaterialListOutput = (Omit<Material, 'unitCost'> & {
  unitCost: number;
})[];

export const materialsRouter = createTRPCRouter({
  // THE FIX: Add the explicit return type and map the data.
  list: protectedWorkshopProcedure.query(async ({ ctx }): Promise<MaterialListOutput> => {
    const materials = await ctx.prisma.material.findMany({
      where: { workshopId: ctx.workshopId },
      orderBy: { name: 'asc' },
    });
    // Convert Decimal to number before returning to client
    return materials.map(m => ({ ...m, unitCost: m.unitCost.toNumber() }));
  }),

  getById: protectedWorkshopProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const material = await ctx.prisma.material.findFirst({
        where: { id: input.id, workshopId: ctx.workshopId },
      });
      if (!material) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      // THE FIX: Also convert the Decimal for the single-item query.
      return { ...material, unitCost: material.unitCost.toNumber() };
    }),

  create: protectedWorkshopProcedure
    .input(createMaterialSchema)
    .mutation(async ({ ctx, input }) => {
      const { workshopId, ...materialData } = input as any;
      return ctx.prisma.material.create({
        data: {
          workshopId: ctx.workshopId,
          ...materialData,
          unitCost: new Prisma.Decimal(materialData.unitCost),
        },
      });
    }),

  update: protectedWorkshopProcedure
    .input(createMaterialSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, workshopId, ...data } = input as any;
      return ctx.prisma.material.update({
        where: { id, workshopId: ctx.workshopId },
        data: {
          ...data,
          unitCost: new Prisma.Decimal(data.unitCost),
        },
      });
    }),
  
  delete: protectedWorkshopProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.material.delete({
        where: { id: input.id, workshopId: ctx.workshopId },
      });
    }),
});