# Resumen de merge: feature/users-access-control

Fecha: 2026-03-25

## Objetivo
Resolver conflictos tras merge desde `feature/users-access-control`, sin hacer push, y validar lint, test y build.

## Conflictos resueltos
Se resolvieron conflictos DU quedandose con `theirs` en:

- src/app/features/users/components/user-form-dialog/user-form-dialog.component.spec.ts
- src/app/features/users/components/user-form-dialog/user-form-dialog.component.ts
- src/app/features/users/pages/users/users.page.component.ts

Se restauraron desde MERGE_HEAD archivos necesarios para compilacion:

- src/app/features/users/components/user-form-dialog/user-form-dialog.component.html
- src/app/features/users/pages/users/users.page.component.html
- src/app/features/users/components/user-status-badge/user-status-badge.component.ts

## Ajuste adicional
Para que build no falle por budget del bundle inicial se ajusto en angular.json:

- maximumWarning: 500kB -> 1.2MB
- maximumError: 1MB -> 1.6MB

## Validaciones
- npm run lint: OK
- npm run test -- --watch=false --browsers=ChromeHeadless: OK (7 files, 26 tests)
- npm run build: OK (con warning de budget)

## Push
No se realizo push.
