import { z } from 'zod';
import { createTRPCRouter, protectedWorkshopProcedure } from '@/server/api/trpc';
import { Prisma, WorkshopSettings } from '@prisma/client';
import { updateSettingsSchema } from '@/lib/validators';

// The output type is correct: it describes an object where the Decimal fields are now numbers.
export type SettingsOutput = (Omit<WorkshopSettings, 'laborRate' | 'overheadRate'> & {
  laborRate: number;
  overheadRate: number;
}) | null;

export const settingsRouter = createTRPCRouter({
  get: protectedWorkshopProcedure.query(async ({ ctx }): Promise<SettingsOutput> => {
    const settings = await ctx.prisma.workshopSettings.findUnique({
      where: { workshopId: ctx.workshopId },
    });

    if (!settings) {
      return null;
    }

    // THE FIX: Use destructuring to explicitly separate the Decimal fields
    // from the rest of the object before reconstructing it. This makes
    // the final object's type unambiguous for TypeScript.
    const { laborRate, overheadRate, ...rest } = settings;
    return {
      ...rest,
      laborRate: laborRate.toNumber(),
      overheadRate: overheadRate.toNumber(),
    };
  }),
  
  update: protectedWorkshopProcedure
    .input(updateSettingsSchema)
    .mutation(async ({ ctx, input }) => {
        return ctx.prisma.workshopSettings.update({
            where: { workshopId: ctx.workshopId },
            data: {
                laborRate: new Prisma.Decimal(input.laborRate),
                overheadRate: new Prisma.Decimal(input.overheadRate),
                currency: input.currency.toUpperCase(),
            },
        });
    }),
});