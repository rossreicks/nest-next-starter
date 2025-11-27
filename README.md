# NestJS + Next.js Monorepo Template

⚡ Production-ready full-stack template: NestJS API + Next.js frontend in a pnpm monorepo. Features single-port deployment, shared TypeScript types, Docker multi-stage builds, health checks, and Railway/Nixpacks support.

## Architecture

This is a **PNPM monorepo** with three main packages:

- **`packages/server`** - NestJS application serving API routes
- **`packages/client`** - Next.js application serving frontend routes
- **`packages/shared`** - Shared TypeScript types and utilities

### Routing Strategy

- **`/api/*`** routes → Handled by NestJS controllers
- **All other routes** → Handled by Next.js pages/app router

The server integrates Next.js as middleware, allowing both applications to run on a single port with seamless routing.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10.23.0+ (specified in `packageManager` field)

### Installation

```bash
pnpm install
```

### Development

Start the development server (runs both NestJS and Next.js):

```bash
pnpm dev
```

The application will be available at `http://localhost:4000`

- API endpoints: `http://localhost:4000/api/*`
- Frontend pages: `http://localhost:4000/*`

### Production Build

```bash
# Build both packages
pnpm build

# Start production server
pnpm start
```

## 📦 Package Scripts

### Root Level

- `pnpm dev` - Start development server
- `pnpm start` - Start production server
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages with Biome
- `pnpm format` - Format all packages with Biome

### Server Package (`packages/server`)

- `pnpm --filter server start:dev` - Start NestJS in watch mode
- `pnpm --filter server start:prod` - Start NestJS in production mode
- `pnpm --filter server build` - Build NestJS application
- `pnpm --filter server test` - Run unit tests
- `pnpm --filter server test:e2e` - Run end-to-end tests

### Client Package (`packages/client`)

- `pnpm --filter client dev` - Start Next.js dev server (standalone)
- `pnpm --filter client build` - Build Next.js application
- `pnpm --filter client start` - Start Next.js production server (standalone)

## 🛠️ Tech Stack

### Backend (NestJS)
- **Framework**: NestJS 11.x
- **Runtime**: Node.js with Express adapter
- **Validation**: class-validator & class-transformer
- **Configuration**: @nestjs/config
- **Build**: SWC for fast compilation

### Frontend (Next.js)
- **Framework**: Next.js 16.x with App Router
- **React**: React 19.x
- **Styling**: Tailwind CSS 4.x
- **TypeScript**: TypeScript 5.x

### Development Tools
- **Package Manager**: pnpm with workspaces
- **Linting/Formatting**: Biome
- **Git Hooks**: Lefthook
- **Testing**: Jest (NestJS)

## 📁 Project Structure

```
nest-next-starter/
├── packages/
│   ├── server/          # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts  # Entry point (integrates Next.js)
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── app.service.ts
│   │   └── package.json
│   ├── client/          # Next.js frontend
│   │   ├── src/
│   │   │   └── app/     # Next.js App Router
│   │   └── package.json
│   └── shared/          # Shared code
│       └── types/       # Shared TypeScript types
├── package.json         # Root package.json
├── pnpm-workspace.yaml  # PNPM workspace config
└── README.md
```

## 🔧 Configuration

### Environment Variables

The server uses `@nestjs/config` for environment management. Create a `.env` file in the root or `packages/server`:

```env
PORT=4000
NODE_ENV=development
```

### Port Configuration

Default port is `4000`. Change it via:
- Environment variable: `PORT=3000`

## 📝 Shared Types

Types are shared between server and client via the `packages/shared` package:

```typescript
// packages/shared/types/example.d.ts
export interface Example {
  name: string;
  age: number;
}
```

Import in both server and client:
```typescript
import { Example } from "@shared/types/example";
```

## 🏥 Health Checks

The application includes a health check endpoint powered by `@nestjs/terminus`:

- **Endpoint**: `GET /api/health`
- **Checks**: Memory usage (heap & RSS), disk storage

Example response:
```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" }
  },
  "error": {},
  "details": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

This endpoint is useful for:
- Monitoring and alerting systems
- Load balancer health checks
- Kubernetes liveness/readiness probes
- Railway/Nixpacks health monitoring

## 🧪 Testing

### Server Tests

```bash
# Unit tests
pnpm --filter server test

# E2E tests
pnpm --filter server test:e2e

# Coverage
pnpm --filter server test:cov
```

## 🎨 Code Quality

This project uses **Biome** for linting and formatting:

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm format
```

Git hooks are configured via **Lefthook** to run linting before commits.

### VS Code Setup

The project includes VS Code settings for optimal development experience:

- **Auto-formatting** on save with Biome
- **Recommended extensions** (prompted on first open)
- **TypeScript workspace SDK** configuration

Open the project in VS Code and you'll be prompted to install recommended extensions.

## 🚢 Deployment

### Build for Production

```bash
pnpm build
```

This will:
1. Build the NestJS server to `packages/server/dist`
2. Build the Next.js client (integrated into the server)

### Running Production Build

```bash
pnpm start
```

The production server runs both NestJS and Next.js on a single port.

### Railway / Nixpacks Deployment

This template is optimized for **Railway** and **Nixpacks** deployment. Both platforms automatically detect the `build` and `start` commands from your root `package.json`:

- **Build Command**: `pnpm build` (automatically detected)
- **Start Command**: `pnpm start` (automatically detected)
- **Port**: Configure via `PORT` environment variable (defaults to 4000)

#### Railway Setup

1. Connect your repository to Railway
2. Railway will automatically detect the build and start commands
3. Set environment variables in Railway dashboard (if needed)
4. Deploy!

#### Environment Variables

Create a `.env` file or set in your deployment platform:

```env
PORT=4000
NODE_ENV=production
```

> **Note**: The `.env.example` file is located in `packages/server/.env.example` for reference.

### Docker Deployment

A simple, production-ready `Dockerfile` is included in the root directory. It's designed to be easy to understand and modify:

#### Features

- **Single-stage build** - Simple and straightforward, easy to understand
- **Non-root user** - Runs as `nestjs` user (UID 1001) for security
- **Alpine Linux** - Minimal base image (~200MB)
- **Health checks** - Built-in health check endpoint monitoring
- **Frozen lockfile** - Ensures reproducible builds
- **Clear comments** - Each step is explained

> **Note**: For even simpler deployments, Railway/Nixpacks can auto-detect and build your project without a Dockerfile. The Dockerfile is included for users who want more control or are deploying elsewhere.

#### Building the Docker Image

```bash
# Build the image
docker build -t my-nest-app .

# Run the container
docker run -p 4000:4000 --env-file .env my-nest-app

# Or with environment variables
docker run -p 3000:3000 -e PORT=3000 -e NODE_ENV=production my-nest-app
```

#### Docker Compose Example

Create a `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure linting passes: `pnpm lint`
4. Run tests: `pnpm --filter server test`
5. Submit a pull request
