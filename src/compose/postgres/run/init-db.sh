#!/bin/bash
set -e

#psql -U "$POSTGRES_USER" -tc "SELECT 1 FROM pg_database WHERE datname = 'hass'" \
#	| grep -q 1 || psql -U "$POSTGRES_USER" -c "CREATE DATABASE hass"

#psql -U "$POSTGRES_USER" -tc "SELECT 1 FROM pg_database WHERE datname = 'keycloak'" \
#	| grep -q 1 || psql -U "$POSTGRES_USER" -c "CREATE DATABASE keycloak"