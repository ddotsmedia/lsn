FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY . .

RUN npm ci
RUN npm run build --workspace=apps/frontend

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/public ./apps/frontend/public

CMD ["node", "apps/frontend/server.js"]
