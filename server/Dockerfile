FROM node:20
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

ARG SERVER_URL
ARG CORS_ORIGIN
ENV SERVER_URL=$SERVER_URL
ENV CORS_ORIGIN=$CORS_ORIGIN

EXPOSE 3000

CMD ["node", "server.js"]
