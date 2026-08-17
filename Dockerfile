# ---- build stage ----
FROM node:22-slim AS build
WORKDIR /app

# install deps first (layer caching) — workspaces need the manifests present
COPY shared/package.json shared/
COPY server/package.json server/
COPY panel/package.json frontend/
RUN npm install

# full source, then compile all workspaces
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# the FULL hoisted tree, including workspace symlinks — no reinstall, no prune
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/server ./server
COPY --from=build /app/panel ./panel

CMD ["node", "server/dist/index.js"]
