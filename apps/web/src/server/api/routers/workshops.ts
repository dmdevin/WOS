import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { Workshop } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export type WorkshopListOutput = Workshop[];

export const workshopsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Step 1: Create the new workshop as before
      const newWorkshop = await ctx.prisma.workshop.create({
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

      // --- THE DEFINITIVE FIX: Create a set of default operations for the new workshop ---
      
      // Define the standard operations every new workshop should have
      const defaultOperations = [
        { name: 'Cutting', description: 'Cutting leather panels from a hide.' },
        { name: 'Skiving', description: 'Thinning the edges of leather pieces.' },
        { name: 'Stitching', description: 'Assembling pieces with a sewing machine or by hand.' },
        { name: 'Finishing', description: 'Burnishing edges, applying conditioner, etc.' },
        { name: 'Packing', description: 'Preparing the finished product for shipment.' },
        { name: 'Assembly', description: 'Attaching hardware or other components.' },
      ];

      // Use `createMany` to efficiently add all default operations in one database call
      await ctx.prisma.operation.createMany({
        data: defaultOperations.map(op => ({
          ...op,
          workshopId: newWorkshop.id, // Link each new operation to the workshop we just created
        })),
      });
      // --- END OF FIX ---

      // Step 2: Return the created workshop as before
      return newWorkshop;
    }),

  list: protectedProcedure.query(async ({ ctx }): Promise<WorkshopListOutput> => {
    const userId = ctx.session.user.id;

    const memberships = await ctx.prisma.userWorkshop.findMany({
      where: { userId: userId },
      include: { workshop: true },
    });
    return memberships.map(m => m.workshop);
  }),
});