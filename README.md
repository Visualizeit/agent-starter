# Agent Starter

Full-stack AI chat starter built with TanStack Start, React, Mantine, and Tailwind CSS.

## Setup

Requires Node.js and pnpm.

```sh
pnpm install
cp .env.example .env
pnpm db:migrate
```

Set `DEEPSEEK_API_KEY` in `.env`, then start the app:

```sh
pnpm dev
```

## Scripts

- `pnpm build` - Build for production
- `pnpm start` - Start the production server
- `pnpm typecheck` - Check TypeScript
- `pnpm check` - Check code quality
- `pnpm fix` - Fix code quality issues
