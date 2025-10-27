import { z } from 'zod';
import { createTRPCRouter, protectedWorkshopProcedure } from '@/server/api/trpc';
import { Prisma, WorkflowStage } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { createOrderSchema, orderItemSchema } from '@/lib/validators';

type OrderItemInput = z.infer<typeof orderItemSchema>;

type OrderPayload = Prisma.OrderGetPayload<{
  include: { customer: true; orderItems: true };
}>;

export type OrderListOutput = (Omit<OrderPayload, 'totalPrice' | 'discount' | 'shippingCost'> & {
  totalPrice: number;
  discount: number;
  shippingCost: number;
})[];

export const ordersRouter = createTRPCRouter({
  list: protectedWorkshopProcedure.query(async ({ ctx }): Promise<OrderListOutput> => {
    const orders = await ctx.prisma.order.findMany({
      where: { workshopId: ctx.workshopId },
      include: { customer: true, orderItems: true },
      orderBy: { createdAt: 'desc' },
    });
    
    return orders.map(order => ({
      ...order,
      totalPrice: order.totalPrice.toNumber(),
      discount: order.discount.toNumber(),
      shippingCost: order.shippingCost.toNumber(),
    }));
  }),

  getById: protectedWorkshopProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findFirst({
        where: { id: input.id, workshopId: ctx.workshopId },
        include: { customer: true, orderItems: { include: { productVersion: { include: { product: true } } } } },
      });

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      return {
        ...order,
        totalPrice: order.totalPrice.toNumber(),
        discount: order.discount.toNumber(),
        shippingCost: order.shippingCost.toNumber(),
      };
    }),

  create: protectedWorkshopProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const { workshopId, ...orderData } = input as any;
      const lastOrder = await ctx.prisma.order.findFirst({
        where: { workshopId: ctx.workshopId },
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });
      const newOrderNum = parseInt(lastOrder?.orderNumber.split('-').pop() ?? '1000') + 1;
      const totalPrice = (orderData.items as any[]).reduce((acc: number, item: any) => acc + item.unitPrice * item.quantity, 0);

      return ctx.prisma.order.create({
        data: {
          workshopId: ctx.workshopId,
          customerId: orderData.customerId,
          orderNumber: `WOS-${newOrderNum}`,
          workflowStage: WorkflowStage.PENDING,
          totalPrice: new Prisma.Decimal(totalPrice),
          notes: orderData.notes,
          orderItems: {
            create: (orderData.items as any[]).map((item: any) => ({
              productVersionId: item.productVersionId,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
            })),
          },
        },
      });
    }),

  updateStage: protectedWorkshopProcedure
    .input(z.object({ orderId: z.string(), stage: z.nativeEnum(WorkflowStage) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.order.update({
        where: { id: input.orderId, workshopId: ctx.workshopId },
        data: { workflowStage: input.stage },
      });
    }),
});