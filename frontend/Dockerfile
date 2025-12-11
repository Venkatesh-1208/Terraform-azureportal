# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Install only production dependencies
RUN npm install --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js .

EXPOSE 3000
CMD ["npm", "start"]
