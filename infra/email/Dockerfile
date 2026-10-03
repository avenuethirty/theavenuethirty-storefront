FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src/server ./src/server
COPY directus/email-service.ts ./directus/email-service.ts
USER node
ENV PORT=3100
EXPOSE 3100
CMD ["./node_modules/.bin/tsx", "directus/email-service.ts"]
