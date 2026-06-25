# Repository Copilot Instructions

This file mirrors `copilot-instrucciones.md` and is used for automatic Copilot context loading.

## Project Scope
- Monorepo with `frontend/` (active Angular app) and `backend/` (placeholder).
- Architecture source of truth is `README.md` at repo root.

## Frontend Stack
- Angular 21 with standalone architecture.
- Strict TypeScript.
- PrimeNG + PrimeIcons + `@primeuix/themes` custom preset (`ErpPreset`).
- Tailwind CSS v4 + `tailwindcss-primeui`.
- Vitest via `ng test`.

## Working Commands (run in `frontend/`)
- `npm install`
- `npm run start`
- `npm run build`
- `npm run test`

## Architecture Model (Required)
Use a hybrid model:
- Feature-first organization by product domain.
- Internal layered flow:
	UI (page/component) -> feature store/facade -> use case -> repository contract -> repository implementation -> API.

Preserve app layers in `frontend/src/app`:
- `core/`: auth, guards, interceptors, global errors, cross-cutting app config.
- `domain/`: business entities/models, repository contracts, use cases.
- `infrastructure/`: DTOs, mappers, repository implementations (http/mock).
- `features/`: feature pages/components/state/resolvers/routes.
- `shared/`: reusable UI/utilities without feature business logic.
- `theme/`: global design tokens and styling.

## Dependency Rules (Mandatory)
- `domain` must not depend on `features` or `infrastructure`, and must not perform HTTP calls.
- `infrastructure` may depend on `domain`, not on `features`.
- `features` can depend on `domain`, `core`, `shared` but not on direct API access.
- Register concrete repositories via DI in `app.config.ts`.
- While backend is not ready, keep mock repositories and add targeted migration TODOs, e.g.:
```ts
// TODO add base url for API REST
```

## Angular Conventions
- Prefer standalone components/directives/pipes.
- Default to `ChangeDetectionStrategy.OnPush`.
- Prefer signals API: `signal`, `computed`, `effect`.
- Use `inject()` for dependency injection.
- Use `input()` / `output()` APIs.
- Use native template control flow: `@if`, `@for`, `@switch`.

## Naming and Implementation Conventions
- Files in `kebab-case`; classes/types in `PascalCase`.
- Keep suffixes consistent: `*.component.ts`, `*.service.ts`, `*.store.ts`, `*.usecase.ts`, `*.repository.ts`, `*.mapper.ts`.
- Keep business logic in use cases, not in presentational components.
- Use typed forms and explicit validation.
- Add unit tests for non-trivial logic (use cases, stores, critical components).

## Import Aliases (Mandatory)
Use aliases from `frontend/tsconfig.json`; avoid deep relative imports:
- `@core/*`
- `@domain/*`
- `@infrastructure/*`
- `@features/*`
- `@shared/*`
- `@theme/*`

## UI and Design System
- Reuse existing `shared/ui` components before creating new wrappers.
- Existing base components:
	- `ui-button` variants: `default | destructive | outline | secondary | ghost | link`.
	- `ui-input` variants: `default | filled`, sizes `default | sm | lg`, plus CVA support.
- Keep tokens centralized in `frontend/src/theme/styles.css`.
- Keep Prime preset centralized in `frontend/src/theme/erp.preset.ts`.
- Respect CSS layer order: `tailwind-base, primeng, tailwind-utilities`.
- Prefer semantic tokens over hardcoded visual values.
- Keep mobile-first behavior, visible focus, and complete state coverage (`hover/active/disabled`).

## Current State Notes
- Layered folders are scaffolded; many are still `.gitkeep` placeholders.
- `app.routes.ts` is mostly empty and should receive explicit feature routes.

## New Feature Checklist
1. Create entity/model, repository contract, and use cases in `domain`.
2. Implement mock repository in `infrastructure`.
3. Register provider bindings in `app.config.ts`.
4. Add lazy routes and standalone pages in `features/<feature>`.
5. Implement feature store/facade with signals.
6. Apply design tokens and Tailwind utilities.
7. Add unit tests for use cases, store, and key components.

## Code Review & Linting Guidelines
- Always run `ng lint` and address reported errors before merging.
- Inspect offending files with `read_file` when lint issues arise.
- Irregular whitespace (non‑breaking spaces) often triggers `no-irregular-whitespace`; remove them and standardize indentation.
- Use `multi_replace_string_in_file` for batch fixes to maintain efficiency.
- After edits, re-run lint/tests to confirm issues are resolved.
- Keep PR messages concise: show what was changed and why.
- Record common lessons in session memory for future troubleshooting.
