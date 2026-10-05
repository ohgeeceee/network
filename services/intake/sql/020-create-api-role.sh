#!/bin/sh
set -eu
: "${INTAKE_DB_PASSWORD:?INTAKE_DB_PASSWORD must be set for initial database creation}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v intake_password="$INTAKE_DB_PASSWORD" <<'SQL'
CREATE ROLE intake_api LOGIN PASSWORD :'intake_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO intake_api;
GRANT EXECUTE ON FUNCTION create_public_intake(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) TO intake_api;
SQL
