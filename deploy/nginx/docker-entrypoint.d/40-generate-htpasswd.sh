#!/bin/sh
set -e

: "${METRICS_USER:?METRICS_USER is required}"
: "${METRICS_PASSWORD:?METRICS_PASSWORD is required}"

htpasswd -nbB "${METRICS_USER}" "${METRICS_PASSWORD}" > /etc/nginx/.htpasswd