# Agent Starter

Full-stack AI chat starter built with TanStack Start, React, Mantine, and Tailwind CSS.

## Setup

Requires Node.js and pnpm.

```sh
pnpm install
cp .env.example .env
pnpm db:migrate
```

Start the app:

```sh
pnpm dev
```

Configure a model from the composer’s `Select model` menu. API keys stay in the TanStack BYOK client storage and are sent only for the selected request.

## Scripts

- `pnpm build` - Build for production
- `pnpm start` - Start the production server
- `pnpm typecheck` - Check TypeScript
- `pnpm check` - Check code quality
- `pnpm fix` - Fix code quality issues
