import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { hash } from 'bcryptjs';

export const userRouter = createTRPCRouter({
    register: publicProcedure
        .input(z.object({
            email: z.string().email(),
            password: z.string().min(8),
            name: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const passwordHash = await hash(input.password, 10);
            return ctx.prisma.user.create({
                data: {
                    email: input.email,
                    passwordHash,
                    name: input.name,
                }
            });
        }),
});