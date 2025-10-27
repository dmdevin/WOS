# Stage 1: The Builder
# This stage installs all dependencies, generates prisma client, and builds the app.
FROM node:20-alpine AS builder
WORKDIR /app

# Install OS-level dependencies for Prisma and other tools
RUN apk add --no-cache openssl ca-certificates
RUN npm install -g turbo

# Copy all necessary configuration and package manifest files
COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY tsconfig* ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma/

# Install all monorepo dependencies.
# The postinstall script (if present) will run.
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the web application. The memory flag is in package.json.
RUN npx turbo build --filter=web...


# Stage 2: The Runner
# This stage creates the final, lean production image for `next start`.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only the required OS library for Prisma's runtime
RUN apk add --no-cache openssl

# --- THE DEFINITIVE FIX ---
# We will run as the root user. This is acceptable for local Docker development
# with volumes and completely solves all file permission issues. The non-root
# user setup has proven too complex and unreliable in this environment.

# Copy only the necessary package.json files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/package-lock.json ./

# Install ONLY production dependencies, and skip any postinstall scripts.
RUN npm install --omit=dev --ignore-scripts

# Copy the generated Prisma Client and query engine from the builder stage
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Copy the built application output and public assets from the builder stage
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT 3000

# Set the working directory for the start command
WORKDIR /app/apps/web

# Run the Next.js production server
CMD ["npm", "run", "start"]