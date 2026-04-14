# Paso 7 — Git Workflow y CI/CD

Flujo de trabajo con ramas y convenciones de commits basado en el workflow real del proyecto.

---

## 7.1 Estrategia de ramas

Cada capa de la feature se desarrolla en una **rama separada**, creada secuencialmente desde la anterior:

```
development (base)
  └── feature/frontend_<feature>_domain
        └── feature/frontend_<feature>_infrastructure
              └── feature/frontend_<feature>_store
                    └── feature/<feature>_list_page
                          └── feature/frontend_<feature>_test
                                └── feature/frontend_<feature>-api-integration
```

### Ramas en orden de creación:

| # | Rama | Contenido | Base |
|---|---|---|---|
| 1 | `feature/frontend_<feature>_domain` | Modelos, enums, errores, repos, use cases | `development` |
| 2 | `feature/frontend_<feature>_infrastructure` | DTOs, mappers, mock/HTTP repos | Rama #1 |
| 3 | `feature/frontend_<feature>_store` | Signal store completo | Rama #2 |
| 4 | `feature/<feature>_list_page` | Pages, components, routes | Rama #3 |
| 5 | `feature/frontend_<feature>_test` | Unit tests completos | Rama #4 |
| 6 | `feature/frontend_<feature>-api-integration` | Switch mock→HTTP, ajustes API | Rama #5 |

---

## 7.2 Flujo de trabajo por rama

### Crear rama domain:
```bash
git checkout development
git pull origin development
git checkout -b feature/frontend_<feature>_domain
# ... implementar capa domain ...
git add .
git commit -m "feat(<feature>): add domain models, repository and use cases"
git push -u origin feature/frontend_<feature>_domain
```

### Crear rama infrastructure (desde domain):
```bash
git checkout feature/frontend_<feature>_domain
git checkout -b feature/frontend_<feature>_infrastructure
# ... implementar capa infrastructure ...
git add .
git commit -m "feat(<feature>-infra): add DTOs, mapper, and mock/HTTP repositories"
git push -u origin feature/frontend_<feature>_infrastructure
```

### Crear rama store (desde infrastructure):
```bash
git checkout feature/frontend_<feature>_infrastructure
git checkout -b feature/frontend_<feature>_store
# ... implementar store ...
git add .
git commit -m "feat(<feature>-store): add signal store with CRUD operations"
git push -u origin feature/frontend_<feature>_store
```

### Crear rama page (desde store):
```bash
git checkout feature/frontend_<feature>_store
git checkout -b feature/<feature>_list_page
# ... implementar pages y components ...
git add .
git commit -m "feat(<feature>): add list page, form dialog and routes"
git push -u origin feature/<feature>_list_page
```

### Crear rama tests (desde page):
```bash
git checkout feature/<feature>_list_page
git checkout -b feature/frontend_<feature>_test
# ... implementar tests ...
git add .
git commit -m "test(<feature>): add unit tests for use cases, store and components"
git push -u origin feature/frontend_<feature>_test
```

### Crear rama api-integration (desde tests):
```bash
git checkout feature/frontend_<feature>_test
git checkout -b feature/frontend_<feature>-api-integration
# ... cambiar mock por HTTP, ajustar ...
git add .
git commit -m "feat(<feature>): connect to API via HTTP repository"
git push -u origin feature/frontend_<feature>-api-integration
```

---

## 7.3 Convención de commits

Formato: `<type>(<scope>): <description>`

### Types:
| Type | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin fix ni feature |
| `test` | Tests nuevos o corrección de tests |
| `chore` | Mantenimiento, config, limpieza |
| `docs` | Documentación |

### Scopes típicos por rama:
| Rama | Scopes de ejemplo |
|---|---|
| domain | `<feature>`, `<feature>-domain` |
| infrastructure | `<feature>-infra` |
| store | `<feature>-store` |
| page | `<feature>`, `<feature>-page` |
| test | `<feature>` |
| api-integration | `<feature>` |

### Ejemplos reales del proyecto:
```
feat(user): add domain models, repository and use cases
refactor(users): migrate domain types to numeric IDs and update user model
feat(users-domain): add typed user error models
feat(users-infra): map http errors to domain user exceptions
feat(users-store): translate domain errors into ui messages
feat(users): add users page, dialog components, status badge and routes
test(users-store): cover mapped domain error messages
feat(users): connect users feature to onrender api via http repository
feat: switch UserRepository to HttpUserRepository
```

---

## 7.4 CI/CD Pipeline

El proyecto tiene un pipeline en `.github/workflows/ci-cd.yml` que ejecuta en push/PR a `main` y `development`:

### Job `lint-and-test`:
```bash
# Se ejecuta en cada push y PR
npm ci                    # Instalar dependencias
npm run lint              # ESLint
npm run test:ci           # Vitest
```

### Antes de hacer push:
```bash
cd frontend
npm run lint              # Verificar que no hay errores de lint
npm run test              # Verificar que los tests pasan
```

### Jobs de deploy:
- **`deploy-dev`**: push a `development` → deploy a Firebase DEV
- **`deploy-prod`**: push a `main` → deploy a Firebase PROD

---

## 7.5 Merge workflow

1. Implementar en rama feature.
2. Push y crear Pull Request hacia `development`.
3. CI ejecuta lint + tests.
4. Code review.
5. Merge a `development`.
6. Cuando está listo para producción: merge `development` → `main`.

---

## 7.6 Checklist de git workflow

- [ ] Rama creada desde la base correcta (ver tabla)
- [ ] Nombre de rama sigue convención: `feature/frontend_<feature>_<layer>`
- [ ] Commits siguen conventional commits: `<type>(<scope>): <description>`
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run test` pasa sin errores
- [ ] Push y PR hacia `development`
- [ ] CI pipeline verde
