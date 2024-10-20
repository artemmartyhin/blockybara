# Stage 1: Install dependencies
FROM node:18-alpine AS deps

WORKDIR /app

# Copy only the frontend package's package.json and yarn.lock
COPY package.json ./

# Install dependencies locally
RUN yarn install --frozen-lockfile

# Stage 2: Build the app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy the rest of the app files
COPY . .

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Add node_modules/.bin to PATH
ENV PATH /app/node_modules/.bin:$PATH

# Build the Next.js app
RUN yarn build

# Stage 3: Serve the app using a lightweight image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy package.json and install only production dependencies
COPY package.json ./
RUN yarn install --production --frozen-lockfile

# Copy the build output and necessary files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["yarn", "start"]
