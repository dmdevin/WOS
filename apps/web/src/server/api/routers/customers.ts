import { z } from 'zod';
import { createTRPCRouter, protectedWorkshopProcedure } from '@/server/api/trpc';
import { customerSchema } from '@/lib/validators';
import { Prisma, Customer } from 'db';

export type CustomerListOutput = (Customer & {
  _count: {
    orders: number;
  };
})[];

export const customersRouter = createTRPCRouter({
  list: protectedWorkshopProcedure.query(async ({ ctx }): Promise<CustomerListOutput> => {
    return ctx.prisma.customer.findMany({
      where: { workshopId: ctx.workshopId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
  }),

  create: protectedWorkshopProcedure
    .input(customerSchema)
    .mutation(async ({ ctx, input }) => {
      const { workshopId, ...customerData } = input as any;
      return ctx.prisma.customer.create({
        data: {
          workshopId: ctx.workshopId,
          ...customerData,
        },
      });
    }),
  
  getById: protectedWorkshopProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
        return ctx.prisma.customer.findFirst({
            where: { id: input.customerId, workshopId: ctx.workshopId },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                }
            }
        });
    }),
});