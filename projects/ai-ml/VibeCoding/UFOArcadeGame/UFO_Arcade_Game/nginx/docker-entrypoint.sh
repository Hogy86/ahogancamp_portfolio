#!/bin/sh
set -e
TLS_MODE="${TLS_MODE:-https}"
TLS_CERT_PATH="${TLS_CERT_PATH:-/certs/localhost.pem}"
TLS_KEY_PATH="${TLS_KEY_PATH:-/certs/localhost-key.pem}"

if [ "$TLS_MODE" = "http" ]; then
  cp /etc/nginx/tmpl/http.conf /etc/nginx/conf.d/default.conf
else
  if [ ! -f "$TLS_CERT_PATH" ] || [ ! -f "$TLS_KEY_PATH" ]; then
    echo "ERROR: TLS_MODE=https but cert or key missing."
    echo "  TLS_CERT_PATH=$TLS_CERT_PATH"
    echo "  TLS_KEY_PATH=$TLS_KEY_PATH"
    echo "Mount certs read-only to /certs or set TLS_MODE=http for local HTTP."
    exit 1
  fi
  sed -e "s#TLS_CERT_PATH_PLACEHOLDER#$TLS_CERT_PATH#g" \
      -e "s#TLS_KEY_PATH_PLACEHOLDER#$TLS_KEY_PATH#g" \
      /etc/nginx/tmpl/https.conf.template > /etc/nginx/conf.d/default.conf
fi

exec "$@"
