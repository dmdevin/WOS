import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/server/db';
import { z } from 'zod';

/**
 * This is the new context creation function for the App Router.
 * It does not need `req` and `res` as arguments because `getServerSession`
 * can read the request cookies implicitly in this environment.
 */
export const createTRPCContext = async () => {
  const session = await getServerSession(authOptions);
  return {
    session,
    prisma,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserHasWorkshopAccess = t.middleware(async ({ ctx, input, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const { workshopId } = input as { workshopId: string };
  if (!workshopId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'workshopId is required' });
  }

  const membership = await ctx.prisma.userWorkshop.findUnique({
    where: {
      userId_workshopId: {
        userId: (ctx.session.user as any).id,
        workshopId,
      },
    },
  });

  if (!membership) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this workshop.' });
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
      workshopId,
    },
  });
});

export const protectedWorkshopProcedure = t.procedure
  .input(z.object({ workshopId: z.string() }))
  .use(enforceUserHasWorkshopAccess);