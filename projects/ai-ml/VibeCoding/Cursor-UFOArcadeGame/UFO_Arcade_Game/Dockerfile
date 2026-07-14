FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
COPY nginx/http.conf /etc/nginx/tmpl/http.conf
COPY nginx/https.conf.template /etc/nginx/tmpl/https.conf.template
RUN chmod +x /docker-entrypoint.sh \
  && sed -i 's/worker_processes  auto/worker_processes  1/' /etc/nginx/nginx.conf
EXPOSE 80 443
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
