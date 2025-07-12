FROM node:24 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build:ssr

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/dist/client ./
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./

RUN npm ci --omit=dev

EXPOSE 4000
CMD ["node", "server/server.mjs"]
