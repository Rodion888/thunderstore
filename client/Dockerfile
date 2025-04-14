FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

FROM nginx:latest
COPY --from=build /app/dist/client/browser /usr/share/nginx/html
COPY --from=build /app/dist/client/browser/assets /usr/share/nginx/html/assets
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
