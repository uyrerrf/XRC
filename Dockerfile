FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY panel/package.json panel/
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
COPY --from=build /app/package.json /app/package-lock.json* ./
COPY --from=build /app/shared/package.json shared/
COPY --from=build /app/server/package.json server/
COPY --from=build /app/panel/package.json panel/
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=build /app/shared/dist shared/dist/
COPY --from=build /app/server/dist server/dist/
COPY --from=build /app/panel/dist panel/dist/
EXPOSE 10000
CMD ["npm", "start"]
