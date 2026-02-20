AGENTS

This document gives agentic coding agents (and humans) a concise, actionable set of commands
and style rules to build, lint, test, and make code changes in this repository.

- Keep changes minimal and focused; follow existing patterns in the repository.

Build / Lint / Test (common commands)
- Install dependencies
  - `pnpm install`
  - Run the project's test suite 
  - `pnpm vitest`

Code Style Guidelines (for agents to follow)
- Goal: readable, idiomatic TypeScript/JavaScript code with predictable errors and tidy imports.

- TypeScript typing and types
  - Prefer typed public interfaces and function signatures. Use `unknown` instead of `any` for inputs you must validate.
  - Prefer generics with clear names (TItem, TResponse) and avoid single-letter generic names except `T` for local small utilities.

- Functions and modules
  - Keep functions small and focused (max ~60 lines). Single responsibility principle.
  - Prefer pure functions where possible. Side effects (I/O, network, DB) should live at the edges of the application.

Keep this file updated if the repository adds new tooling (ESLint/Prettier/Biome, switch to Bun, or introduces a monorepo workspace).
