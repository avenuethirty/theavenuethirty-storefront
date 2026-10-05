FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src/server ./src/server
COPY directus/safepay-service.ts ./directus/safepay-service.ts
USER node
ENV PORT=3200
EXPOSE 3200
CMD ["./node_modules/.bin/tsx", "directus/safepay-service.ts"]
