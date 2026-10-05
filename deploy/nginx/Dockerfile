FROM nginx:1.27-alpine

RUN apk add --no-cache apache2-utils

COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.d/40-generate-htpasswd.sh /docker-entrypoint.d/40-generate-htpasswd.sh
RUN chmod +x /docker-entrypoint.d/40-generate-htpasswd.sh