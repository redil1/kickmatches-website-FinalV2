# Kickmatches Website: Auto-Setup & Deployment Guide

## Automatic Database & App Setup

This project is designed for **zero manual intervention** when deploying to any VPS or server using Docker Compose. All database schema and seed data will be set up automatically on first run and on every restart.

### How It Works

1. **First-Time Database Creation**: The `init.sql` file is used to create the initial schema if the database is brand new.
2. **Migrations Always Run**: On every container start, the migration script (`migrate-database.sh`) runs Drizzle migrations to bring the schema up to date, regardless of database state.
3. **Seed Scripts Always Run**: Seed scripts for email templates and trending players are executed on every start to ensure required data is present.

### Best Practices for Schema Changes

- **All schema changes (new tables, columns, etc.) must be added as Drizzle migration files.**
- Do **not** rely on `init.sql` for updates after initial deployment. It is only for first-time DB creation.
- Keep seed scripts up to date with any new required data.

### Deployment Workflow

1. Clone the repository to your VPS.
2. Run `docker compose up --build -d`.
3. The app, database, and all required tables/data will be set up automatically.
4. To force a full reset (wipe all data and re-apply schema):
   - Run `docker compose down -v` then `docker compose up --build -d`.

### Troubleshooting

- If you add new tables/columns, always create a new migration file and commit it.
- If you change `init.sql`, it will only affect **brand new** databases (or after a full volume reset).
- For persistent environments, rely on migrations and seed scripts for all updates.

---
This workflow guarantees that running Docker Compose on any server will always result in a fully working, up-to-date application and database.
