import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { Workshop } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export type WorkshopListOutput = Workshop[];

export const workshopsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // THE FIX: Thanks to our new type definition, `ctx.session.user.id` is now
      // correctly typed and guaranteed to exist in a protectedProcedure.
      const userId = ctx.session.user.id;
      
      return ctx.prisma.workshop.create({
        data: {
          name: input.name,
          users: {
            create: {
              userId: userId,
              role: 'OWNER',
            },
          },
          settings: {
            create: {}
          }
        },
      });
    }),

  list: protectedProcedure.query(async ({ ctx }): Promise<WorkshopListOutput> => {
    // THE FIX: The same type-safe access is used here.
    const userId = ctx.session.user.id;

    const memberships = await ctx.prisma.userWorkshop.findMany({
      where: { userId: userId },
      include: { workshop: true },
    });
    return memberships.map(m => m.workshop);
  }),
});