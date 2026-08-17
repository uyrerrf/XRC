FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY panel/package.json panel/
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/shared shared/
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/panel/package.json panel/
COPY --from=build /app/server/dist server/dist/
COPY --from=build /app/panel/dist panel/dist/
RUN npm install --omit=dev --no-audit --no-fund
EXPOSE 10000
CMD ["npm", "start"]
