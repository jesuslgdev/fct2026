---
name: feature-generator
description: 'Generate a complete Angular feature following the project layered architecture. Use when: creating a new feature, adding a CRUD module, scaffolding domain+infrastructure+store+pages+tests for a new entity. Covers: domain models, repository contracts, use cases, DTOs, mappers, mock/HTTP repositories, signal store, pages, components, routes, DI registration, and unit tests.'
argument-hint: 'Feature name and entity description (e.g. "products — CRUD for product catalog")'
---

# Feature Generator

Genera una feature CRUD completa siguiendo la arquitectura por capas del proyecto.

## Cuándo usarlo

- Crear una feature nueva desde cero (ej: `products`, `departments`, `orders`).
- Añadir un módulo CRUD completo para una entidad de negocio.
- Necesitas que se respeten todas las convenciones, dependencias y reglas de layers.

## Arquitectura general

```
UI (Page/Component)
  → Store/Facade (signals)
  → Use Case (domain)
  → Repository (contrato abstracto)
  → Repository Implementation (HTTP o Mock)
  → API REST
```

## Estructura de archivos por feature

Para una feature llamada `<feature>` con entidad `<Entity>`:

```
frontend/src/app/
├── domain/
│   ├── enums/<entity>-<enum>.enum.ts          # Enums de dominio
│   ├── models/<entity>.model.ts               # Interfaces de dominio
│   ├── models/<entity>-errors.ts              # Clases de error tipadas
│   ├── repositories/<entity>.repository.ts    # Contrato abstracto
│   └── usecases/<entity>/
│       ├── get-<entities>.usecase.ts
│       ├── get-<entity>-by-id.usecase.ts
│       ├── create-<entity>.usecase.ts
│       ├── update-<entity>.usecase.ts
│       ├── toggle-<entity>-status.usecase.ts  # (si aplica)
│       └── <entity>.usecases.spec.ts
├── infrastructure/
│   ├── dtos/<entity>.dto.ts                   # DTOs snake_case del API
│   ├── mappers/<entity>.mapper.ts             # Mapper DTO ↔ Domain
│   └── repositories/
│       ├── mock/<entity>.repository.mock.ts
│       └── http/<entity>.repository.http.ts
├── features/<feature>/
│   ├── <feature>.routes.ts                    # Rutas lazy
│   ├── state/<feature>.store.ts               # Signal store
│   ├── state/<feature>.store.spec.ts          # Tests del store
│   ├── pages/<feature>/
│   │   ├── <feature>.page.component.ts
│   │   ├── <feature>.page.component.html
│   │   └── <feature>.page.component.css
│   └── components/
│       ├── <entity>-form-dialog/
│       │   ├── <entity>-form-dialog.component.ts
│       │   ├── <entity>-form-dialog.component.html
│       │   └── <entity>-form-dialog.component.spec.ts
│       └── <entity>-status-badge/             # (si tiene estado)
│           └── <entity>-status-badge.component.ts
└── app.config.ts                              # Registro DI
└── app.routes.ts                              # Registro de ruta lazy
```

## Procedimiento paso a paso

Ejecutar en orden. Cada paso corresponde a una rama git y una capa.

### Paso 1 — Domain

Lee las instrucciones detalladas en [01-domain.md](./references/01-domain.md).

Rama git: `feature/frontend_<feature>_domain`

Archivos:
- Enum de roles/tipos (si hay)
- Modelo de entidad + payloads + query params + paginación
- Clases de error tipadas
- Contrato de repositorio (clase abstracta)
- Casos de uso (1 clase = 1 operación)
- Tests unitarios de use cases

### Paso 2 — Infrastructure

Lee las instrucciones detalladas en [02-infrastructure.md](./references/02-infrastructure.md).

Rama git: `feature/frontend_<feature>_infrastructure`

Archivos:
- DTOs (snake_case, reflejan API)
- Mapper estático (DTO ↔ Domain)
- Mock repository (datos hardcoded, @Injectable)
- HTTP repository (HttpClient + error mapping)

### Paso 3 — Feature Store

Lee las instrucciones detalladas en [03-feature-store.md](./references/03-feature-store.md).

Rama git: `feature/frontend_<feature>_store`

Archivos:
- Store con signals (estado, computed, acciones)
- Gestión de diálogos (create/edit/confirm)
- Filtros y paginación
- Mapeo de errores de dominio a mensajes UI

### Paso 4 — Feature Pages y Components

Lee las instrucciones detalladas en [04-feature-pages.md](./references/04-feature-pages.md).

Rama git: `feature/<feature>_list_page`

Archivos:
- Página principal con tabla, filtros y acciones
- Diálogo de formulario (create/edit)
- Badge de estado (si aplica)
- Componentes presentacionales adicionales

### Paso 5 — Tests

Lee las instrucciones detalladas en [05-tests.md](./references/05-tests.md).

Rama git: `feature/frontend_<feature>_test`

Archivos:
- Tests de use cases
- Tests del store
- Tests de componentes con formularios

### Paso 6 — API Integration

Lee las instrucciones detalladas en [06-api-integration.md](./references/06-api-integration.md).

Rama git: `feature/frontend_<feature>-api-integration`

Archivos:
- Cambiar provider en `app.config.ts` de Mock a HTTP
- Verificar que HTTP repository apunta a endpoints correctos

### Paso 7 — Git Workflow y CI/CD

Lee las instrucciones detalladas en [07-git-workflow.md](./references/07-git-workflow.md).

## Reglas obligatorias

1. **Dependencias de capas**: domain → NO depende de nada externo. infrastructure → depende de domain. features → depende de domain + core + shared.
2. **Imports por alias**: `@domain/*`, `@infrastructure/*`, `@features/*`, `@core/*`, `@shared/*`, `@theme/*`.
3. **Angular moderno**: standalone, OnPush, signals, inject(), input()/output(), @if/@for/@switch.
4. **Naming**: archivos en `kebab-case`, clases en `PascalCase`, sufijos consistentes.
5. **DI**: repositorios concretos se registran en `app.config.ts` con `{ provide: AbstractRepo, useClass: ConcreteRepo }`.
6. **Mock first**: implementar mock repo primero, añadir `// TODO add base url for API REST` en HTTP repo.
7. **Tests**: Vitest + TestBed. Mocks con `vi.fn()`. Cubrir use cases, store y formularios.

## Reglas de code review (errores frecuentes que NO deben repetirse)

> Estas reglas provienen de revisiones de código reales. **Son de cumplimiento obligatorio.**

8. **Use cases siempre con `inject()`**: Nunca instanciar use cases con `new`. Siempre usar `inject(MyUseCase)` dentro del contexto de inyección de Angular.
   ```typescript
   // ❌ MAL — new no usa el inyector de Angular
   private readonly getUsersUseCase = new GetUsersUseCase();
   // ✅ BIEN — inject() resuelve dependencias correctamente
   private readonly getUsersUseCase = inject(GetUsersUseCase);
   ```
9. **El store NO inyecta repositorios**: El store solo debe comunicarse con la capa domain a través de use cases. Si necesitas una operación que no tiene use case, créalo primero.
   ```typescript
   // ❌ MAL — acceso directo al repositorio desde el store
   private readonly userRepository = inject(UserRepository);
   // ✅ BIEN — todo va a través de use cases
   private readonly getDepartmentsUseCase = inject(GetDepartmentsUseCase);
   ```
10. **Sin código muerto**: No inyectar ni declarar use cases, variables o imports que no se usan. Si un use case no se necesita aún, no lo incluyas.
11. **Mock data inmutable (`const`)**: Los datos semilla del mock repository deben ser `const`. La clase mock usa una copia por instancia para evitar contaminación entre tests.
    ```typescript
    // ❌ MAL — variable mutable que contamina tests
    let MOCK_USERS: User[] = [...];
    // ✅ BIEN — semilla const + copia por instancia
    const SEED_USERS: User[] = [...];
    @Injectable()
    export class MockUserRepository {
      private users = structuredClone(SEED_USERS);
    }
    ```
12. **PATCH para updates parciales**: Usar `http.patch` cuando el backend recibe un update parcial. Reservar `http.put` solo para reemplazo completo de la entidad.
13. **Cambio de página recarga datos**: `onPageChange()` debe llamar a `loadEntities()` después de actualizar page/pageSize.

## Shared UI disponible

Antes de crear wrappers nuevos, usar los componentes existentes:

| Componente | Selector | API principal |
|---|---|---|
| Button | `<ui-button>` | `label`, `icon`, `variant`, `size`, `(clicked)` |
| Input | `<ui-input>` | `type`, `placeholder`, `formControlName`, `variant`, `size`, `state`, `(valueChange)` |
| Table | `<ui-table>` | `[value]`, `[loading]`, `[paginator]`, `[rows]`, `[totalRecords]`, `#header`, `#body`, `#emptymessage` |
| Dialog | `<ui-dialog>` | `[(visible)]`, `header`, `variant`, `size`, `confirmLabel`, `cancelLabel`, `(confirmed)`, `(cancelled)` |
| Badge | `<ui-badge>` | `label`, `variant` (`success`/`danger`/`warning`/`info`/`secondary`) |
| Card | `<ui-card>` | Contenedor genérico |
| Checkbox | `<ui-checkbox>` | `label`, `variant` |

## CSS global disponible

Clases definidas en `theme/styles.css` que debes reutilizar:

| Clase | Uso |
|---|---|
| `.page` | Layout de página (`flex col gap-4 p-4 page-max-width`) |
| `.page-header` | Cabecera con título + acción (`flex items-center justify-between`) |
| `.filters-row` | Fila de filtros (`flex flex-wrap gap-3`) |
| `.empty-state` | Estado vacío de tabla |
| `.warning-text` | Texto de advertencia en diálogos |
| `.text-style-title` | Título de página |
| `.text-style-hero` | Título hero |
| `.dialog-form` | Layout del formulario dentro de diálogo |
| `.dialog-form-grid` | Grid 1-2 columnas responsivo |
| `.dialog-field` | Wrapper de campo |
| `.dialog-field-label` | Label del campo |
| `.dialog-field-error` | Mensaje de error de validación |
| `.ui-table-base .ui-table-compact .ui-table-bordered` | Clases de tabla |
