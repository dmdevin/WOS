import { createTRPCRouter, protectedWorkshopProcedure } from '@/server/api/trpc';
import { Operation } from '@prisma/client';

// THE FIX: Define and export the explicit return type for the list procedure.
export type OperationListOutput = Operation[];

export const operationsRouter = createTRPCRouter({
  // THE FIX: Add the explicit return type to the query procedure.
  list: protectedWorkshopProcedure.query(async ({ ctx }): Promise<OperationListOutput> => {
    return ctx.prisma.operation.findMany({
      where: { workshopId: ctx.workshopId },
      orderBy: { name: 'asc' },
    });
  }),
});