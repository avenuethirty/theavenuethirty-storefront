FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src/server ./src/server
COPY directus/commerce-maintenance.ts ./directus/commerce-maintenance.ts
USER node
ENV PORT=3300
EXPOSE 3300
CMD ["./node_modules/.bin/tsx", "directus/commerce-maintenance.ts"]
