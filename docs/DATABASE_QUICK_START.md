# Database Quick Start Guide

Quick reference for getting PostgreSQL + Kysely up and running with Docker.

## Initial Setup

```bash
# 1. Start PostgreSQL with Docker
docker-compose up -d

# 2. Verify it's running
docker-compose ps

# 3. Install dependencies
pnpm install

# 4. Copy environment variables
cp env.example .env

# 5. Run migrations
pnpm db:migrate:up
```

## Daily Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres

# Check status
docker-compose ps
```

## Database Commands

```bash
# Run migrations
pnpm db:migrate:up

# Rollback last migration
pnpm db:migrate:down

# Seed database
pnpm db:seed

# Clear all tables (dangerous!)
pnpm db:clear
```

## PostgreSQL Access

```bash
# Connect to database
docker exec -it nest-postgres psql -U postgres -d nest_db

# List all databases
docker exec -it nest-postgres psql -U postgres -c "\l"

# List all tables
docker exec -it nest-postgres psql -U postgres -d nest_db -c "\dt"

# Describe a table
docker exec -it nest-postgres psql -U postgres -d nest_db -c "\d users"

# Run a query
docker exec -it nest-postgres psql -U postgres -d nest_db -c "SELECT * FROM users;"
```

## Backup & Restore

```bash
# Backup
docker exec nest-postgres pg_dump -U postgres nest_db > backup.sql

# Restore
docker exec -i nest-postgres psql -U postgres nest_db < backup.sql
```

## Reset Database

```bash
# Stop and remove everything (including data)
docker-compose down -v

# Start fresh
docker-compose up -d

# Run migrations
pnpm db:migrate:up
```

## Troubleshooting

```bash
# Check if container is healthy
docker-compose ps

# View container logs
docker-compose logs postgres

# Test connection
docker exec -it nest-postgres pg_isready -U postgres

# Restart container
docker-compose restart postgres

# Check port availability
lsof -i :5432  # macOS/Linux
```

## Environment Variables

Default configuration (matches docker-compose.yml):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nest_db
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete documentation.

