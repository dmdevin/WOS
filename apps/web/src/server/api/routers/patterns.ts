import { z } from 'zod';
import { createTRPCRouter, protectedWorkshopProcedure } from '@/server/api/trpc';
import { createPatternSchema, updatePatternSchema } from '@/lib/validators';
import { promises as fs } from 'fs';
import path from 'path';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

export type PatternListOutput = Prisma.PatternGetPayload<{ include: { files: true } }>[];
export type PatternByIdOutput = Prisma.PatternGetPayload<{ include: { files: true } }>;
type FileUpload = { fileData: string; fileName: string };

async function saveFiles(workshopId: string, files: FileUpload[]): Promise<{ fileUrl: string, fileType: string, fileName: string }[]> {
  const uploadPromises = files.map(async (file) => {
    const [header, data] = file.fileData.split(',');
    if (!data) throw new TRPCError({ code: 'BAD_REQUEST', message: `Invalid file data for ${file.fileName}` });

    const buffer = Buffer.from(data, 'base64');
    const fileExtension = path.extname(file.fileName);
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    // --- THE FIX: Save files directly inside the 'public' directory ---
    const uploadDir = path.join(process.cwd(), `public/uploads/${workshopId}/patterns`);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, uniqueFileName), buffer);
    
    const fileUrl = `/uploads/${workshopId}/patterns/${uniqueFileName}`;
    const fileType = fileExtension.toLowerCase() === '.pdf' ? 'pdf' : 'image';

    return { fileUrl, fileType, fileName: file.fileName };
  });

  return Promise.all(uploadPromises);
}

export const patternsRouter = createTRPCRouter({
  list: protectedWorkshopProcedure.query(async ({ ctx }): Promise<PatternListOutput> => {
    return ctx.prisma.pattern.findMany({
      where: { workshopId: ctx.workshopId },
      include: { files: true },
      orderBy: { createdAt: 'desc' },
    });
  }),

  getById: protectedWorkshopProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<PatternByIdOutput> => {
      const pattern = await ctx.prisma.pattern.findFirst({
        where: { id: input.id, workshopId: ctx.workshopId },
        include: { files: true },
      });
      if (!pattern) throw new TRPCError({ code: 'NOT_FOUND' });
      return pattern;
    }),

  create: protectedWorkshopProcedure
    .input(createPatternSchema)
    .mutation(async ({ ctx, input }) => {
      const savedFiles = await saveFiles(ctx.workshopId, input.files);
      return ctx.prisma.pattern.create({
        data: {
          workshopId: ctx.workshopId,
          name: input.name,
          description: input.description,
          tags: input.tags,
          files: { create: savedFiles },
        },
      });
    }),
  
  update: protectedWorkshopProcedure
    .input(updatePatternSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, files, ...data } = input;
      await ctx.prisma.pattern.update({ where: { id }, data });
      if (files && files.length > 0) {
        const savedFiles = await saveFiles(ctx.workshopId, files);
        await ctx.prisma.patternFile.createMany({
          data: savedFiles.map(file => ({ ...file, patternId: id })),
        });
      }
      return ctx.prisma.pattern.findUnique({ where: { id } });
    }),
    
  deleteFile: protectedWorkshopProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.prisma.patternFile.findFirst({ where: { id: input.fileId, pattern: { workshopId: ctx.workshopId } } });
      if (!file) throw new TRPCError({ code: 'NOT_FOUND' });
      try {
        const filePath = path.join(process.cwd(), `public${file.fileUrl}`);
        await fs.unlink(filePath);
      } catch (error) { console.warn("Could not delete file from disk:", error); }
      return ctx.prisma.patternFile.delete({ where: { id: input.fileId } });
    }),

  delete: protectedWorkshopProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pattern = await ctx.prisma.pattern.findFirst({ where: { id: input.id, workshopId: ctx.workshopId }, include: { files: true } });
      if (!pattern) throw new TRPCError({ code: 'NOT_FOUND' });
      const deletePromises = pattern.files.map(file => {
        try {
          const filePath = path.join(process.cwd(), `public${file.fileUrl}`);
          return fs.unlink(filePath);
        } catch (e) { return Promise.resolve(); }
      });
      await Promise.all(deletePromises);
      return ctx.prisma.pattern.delete({ where: { id: input.id } });
    }),
});