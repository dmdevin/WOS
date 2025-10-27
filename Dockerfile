# Stage 1: The Builder
# This stage installs all dependencies, generates the Prisma client, and builds the app.
FROM node:20-alpine AS builder
WORKDIR /app

# Install OS-level dependencies for Prisma and other tools
RUN apk add --no-cache openssl ca-certificates
RUN npm install -g turbo

# Copy all source code and configuration files.
# The .dockerignore file will prevent local node_modules from being copied.
COPY . .

# Install all monorepo dependencies.
# The `postinstall` script in the root package.json will run `prisma generate`.
RUN npm install

# Build the web application. The memory flag is in package.json.
RUN npx turbo build --filter=web...


# Stage 2: The Runner
# This stage creates the final, lean production image for `next start`.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only the required OS library for Prisma's runtime
RUN apk add --no-cache openssl

# Create a non-root user for security (optional for local, but good practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary package.json files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/package-lock.json ./

# Install ONLY production dependencies, and skip any postinstall scripts.
RUN npm install --omit=dev --ignore-scripts

# Copy the generated Prisma Client and query engine from the builder stage.
# This is the crucial step for runtime database access.
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Copy the built application output and public assets from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Set the user to the non-root user
USER nextjs

EXPOSE 3000
ENV PORT 3000

# Set the working directory for the start command
WORKDIR /app/apps/web

# Run the Next.js production server using the script from package.json
CMD ["npm", "run", "start"]