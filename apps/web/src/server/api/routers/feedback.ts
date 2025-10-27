import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { createFeedbackSchema } from '@/lib/validators';
import { TRPCError } from '@trpc/server';

export const feedbackRouter = createTRPCRouter({
  // Public procedure to list all feedback, so anyone can see it.
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { upvotes: true } },
      },
    });
  }),
  
  // Protected procedure for logged-in users to submit feedback.
  create: protectedProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      const feedback = await ctx.prisma.feedback.create({
        data: {
          ...input,
          createdById: userId,
        },
      });

      // You can add your email sending logic here.
      // Example (this would require an email service like Nodemailer or Resend):
      // sendEmail({
      //   to: 'your.email@example.com',
      //   subject: `New Feedback: ${feedback.title}`,
      //   text: `Category: ${feedback.category}\n\n${feedback.description}`,
      // });
      
      return feedback;
    }),

  // Protected procedure for upvoting.
  toggleUpvote: protectedProcedure
    .input(z.object({ feedbackId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { feedbackId } = input;

      const existingUpvote = await ctx.prisma.feedbackUpvote.findUnique({
        where: { feedbackId_userId: { feedbackId, userId } },
      });

      if (existingUpvote) {
        // User has already upvoted, so remove the upvote.
        await ctx.prisma.feedbackUpvote.delete({
          where: { feedbackId_userId: { feedbackId, userId } },
        });
        return { status: 'unvoted' };
      } else {
        // User has not upvoted yet, so create an upvote.
        await ctx.prisma.feedbackUpvote.create({
          data: { feedbackId, userId },
        });
        return { status: 'upvoted' };
      }
    }),
});