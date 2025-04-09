FROM node:18-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with specific versions from package.json
RUN npm install && \
    # Explicitly install the packages that seem to be missing
    npm install @supabase/supabase-js@2.39.7 @supabase/ssr@0.1.0 && \
    mkdir -p /app/node_modules/.cache && \
    chmod -R 777 /app/node_modules/.cache

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 9000

# Start the app
CMD ["npm", "run", "dev"] 