#!/usr/bin/env sh
# Apply the power_plants schema to the local Postgres database.
# Requires the database container from docker-compose.yml to be running.
# Usage: ./load_power_plants_schema.sh

set -e
psql "postgresql://user:password@localhost:5432/energy" -f "$(dirname "$0")/power_plants.sql"