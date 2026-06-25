# Image universelle Tipper (Railway, Fly.io, Render, Cloud Run, etc.)
FROM node:22-slim AS build
WORKDIR /app

# Dépendances + build du client
COPY server/package*.json server/
RUN npm --prefix server install --omit=dev
COPY client/package*.json client/
RUN npm --prefix client install
COPY . .
RUN npm --prefix client run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/server ./server
COPY --from=build /app/client/dist ./client/dist
EXPOSE 4000
# Données de démo au premier lancement puis démarrage du serveur
CMD ["sh", "-c", "npm --prefix server run seed && npm --prefix server start"]
