# Stage 1: Build the app
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock to install dependencies
COPY package.json ./

# Install all dependencies (including devDependencies)
RUN yarn install --frozen-lockfile

# Copy the rest of the app files
COPY . .

# Build the Next.js app
RUN yarn build

# Stage 2: Serve the app using a lightweight image
FROM node:18-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy the build output from the previous stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src/public ./public
COPY --from=builder /app/package.json ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["npx", "next", "start"]
